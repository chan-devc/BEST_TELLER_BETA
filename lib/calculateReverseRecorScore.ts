import { pool } from './db'

export interface ReverseRecorRow {
  no: number
  user_code: string
  fullname: string
  department: string
  txn_count: string
  reverse_count: number
  recor_count: number
  txn_reverse_pct: string
  avg_rev_rate: string
  rev_rate_ratio: string
  txn_recor_pct: string
  avg_cor_rate: string
  cor_rate_ratio: string
  score_reverse: string
  score_recor: string
}

function buildCte(
  rankId: number | null,
  issueDate: string | null = null
): { cte: string; params: unknown[] } {
  const params: unknown[] = []
  let rankFilter = ''
  if (rankId !== null) {
    params.push(rankId)
    rankFilter = `AND mt.department_code IN (
      SELECT department_id FROM rank_department WHERE group_id = $${params.length}
    )`
  }

  let txnDateFilter = `is_active = true AND user_id <> 'BCELONE'`
  let revDateFilter  = 'r.is_active = true'
  let corDateFilter  = 'c.is_active = true'
  if (issueDate !== null) {
    params.push(issueDate)
    const p = `$${params.length}`
    txnDateFilter += ` AND issue_date= ${p}`
    revDateFilter  += ` AND r.issue_date = ${p}`
    corDateFilter  += ` AND c.issue_date = ${p}`
  }

  const cte = `
    WITH
    dp_max AS (
      SELECT COALESCE(MAX(score), 0) AS score FROM discipline_percented WHERE is_active = true
    ),
    txn_agg AS (
      SELECT user_id,
        COALESCE(SUM(CASE WHEN amt IS NOT NULL AND amt < 100000 THEN amt::bigint ELSE 0 END), 0) AS total
      FROM source_txn
      WHERE ${txnDateFilter}
      GROUP BY user_id
    ),
    filtered AS (
      SELECT
        mt.user_code, mt.fullname, d.department,
        COALESCE(t.total,          0) AS txn_count,
        COALESCE(r.reverse_counts, 0) AS reverse_count,
        COALESCE(c.recor_count,    0) AS recor_count
      FROM master_teller mt
      LEFT JOIN department            d ON d.id        = mt.department_code
      LEFT JOIN txn_agg               t ON t.user_id   = mt.user_code
      LEFT JOIN source_teller_reverse r ON r.user_code = mt.user_code AND ${revDateFilter}
      LEFT JOIN source_teller_recor   c ON c.user_code = mt.user_code AND ${corDateFilter}
      WHERE mt.is_active = true ${rankFilter}
    ),
    rates AS (
      SELECT *,
        CASE WHEN txn_count > 0 THEN ROUND((reverse_count::numeric / txn_count) * 100, 4) ELSE 0 END AS txn_reverse_pct,
        CASE WHEN txn_count > 0 THEN ROUND((recor_count::numeric  / txn_count) * 100, 4) ELSE 0 END AS txn_recor_pct
      FROM filtered
    ),
    avgs AS (
      SELECT
        ROUND(AVG(NULLIF(txn_reverse_pct, 0)), 4) AS avg_rev_rate,
        ROUND(AVG(NULLIF(txn_recor_pct,   0)), 4) AS avg_cor_rate
      FROM rates
    ),
    ratios AS (
      SELECT r.*, a.avg_rev_rate,
        CASE WHEN a.avg_rev_rate > 0 THEN ROUND(r.txn_reverse_pct / a.avg_rev_rate, 4) ELSE 0 END AS rev_rate_ratio,
        a.avg_cor_rate,
        CASE WHEN a.avg_cor_rate > 0 THEN ROUND(r.txn_recor_pct  / a.avg_cor_rate, 4) ELSE 0 END AS cor_rate_ratio
      FROM rates r CROSS JOIN avgs a
    ),
    scored AS (
      -- LATERAL joins replace correlated subqueries: one table scan for dp lookup, not N scans
      SELECT rr.*,
        COALESCE(rev_lkp.score, dp_max.score, 0) AS score_reverse,
        COALESCE(cor_lkp.score, dp_max.score, 0) AS score_recor
      FROM ratios rr
      CROSS JOIN dp_max
      LEFT JOIN LATERAL (
        SELECT score FROM discipline_percented
        WHERE is_active = true AND percented <= rr.rev_rate_ratio
        ORDER BY percented DESC LIMIT 1
      ) rev_lkp ON true
      LEFT JOIN LATERAL (
        SELECT score FROM discipline_percented
        WHERE is_active = true AND percented <= rr.cor_rate_ratio
        ORDER BY percented DESC LIMIT 1
      ) cor_lkp ON true
    )
  `
  return { cte, params }
}

export async function queryReverseRecorScore(opts: {
  search?:    string
  page?:      number
  pageSize?:  number
  rankId?:    number | null
  issueDate?: string | null
}): Promise<{
  rows: ReverseRecorRow[]
  total: number
  pageCount: number
  error?: string
}> {
  const { search = '', page = 1, pageSize = 50, rankId = null, issueDate = null } = opts
  const offset = (page - 1) * pageSize

  const { cte, params: baseParams } = buildCte(rankId, issueDate)
  const params = [...baseParams]

  const searchConds: string[] = []
  if (search) {
    params.push(`%${search}%`)
    searchConds.push(`(user_code ILIKE $${params.length} OR fullname ILIKE $${params.length})`)
  }
  const where = searchConds.length ? `WHERE ${searchConds.join(' AND ')}` : ''

  // COUNT(*) OVER() runs the CTE once instead of twice
  const sql = `
    ${cte}
    SELECT
      ROW_NUMBER() OVER (ORDER BY rev_rate_ratio ASC, cor_rate_ratio ASC, user_code)::integer AS no,
      user_code, fullname, department,
      txn_count, reverse_count, recor_count,
      txn_reverse_pct, avg_rev_rate, rev_rate_ratio,
      txn_recor_pct,   avg_cor_rate, cor_rate_ratio,
      score_reverse, score_recor,
      COUNT(*) OVER () AS _total
    FROM scored
    ${where}
    ORDER BY rev_rate_ratio ASC, cor_rate_ratio ASC, user_code
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `

  try {
    const res = await pool.query(sql, [...params, pageSize, offset])
    const total = Number(res.rows[0]?._total ?? 0)
    const rows  = res.rows.map(({ _total: _, ...r }) => r) as ReverseRecorRow[]
    return { rows, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) }
  } catch (e) {
    return { rows: [], total: 0, pageCount: 1, error: e instanceof Error ? e.message : String(e) }
  }
}
