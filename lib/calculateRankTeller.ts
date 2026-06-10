import { pool } from './db'

export interface RankTellerRow {
  no: number
  user_id: string
  fullname: string
  finger_code: string | null
  position: string
  level: string
  sector: string
  department: string
  day_of_work: number
  txn_count: string
  reverse_score: string
  recor_score: string
  attendent_count: number
  txn_score: string
  pro_score: string
  discipline_score: string
  txn_over_avg_score: string
  rev_bonus: string
  recor_bonus: string
  attendent_score: string
  total_score: string
}

function buildCte(
  rankId: number | null,
  deptId: number | null = null,
  issueDate: string | null = null
): { cte: string; params: unknown[] } {
  const params: unknown[] = []
  let rankFilter = ''
  if (deptId !== null) {
    params.push(deptId)
    rankFilter = `AND mt.department_code = $${params.length}`
  } else if (rankId !== null) {
    params.push(rankId)
    rankFilter = `AND mt.department_code IN (
      SELECT department_id FROM rank_department WHERE group_id = $${params.length}
    )`
  }

  let txnDateCond = `is_active = true AND user_id <> 'BCELONE'`
  let revDateCond = 'r.is_active = true'
  let corDateCond = 'c.is_active = true'
  let attDateCond = 'a.is_active = true'
  let scoreDateCond = ''
  if (issueDate !== null) {
    params.push(issueDate)
    const p = `$${params.length}`
    txnDateCond  += ` AND REPLACE(issue_date, '-', '') = REPLACE(${p}, '-', '')`
    revDateCond  += ` AND r.issue_date = ${p}`
    corDateCond  += ` AND c.issue_date = ${p}`
    attDateCond  += ` AND a.issue_date = ${p}`
    scoreDateCond = `AND REPLACE(t.issue_date, '-', '') = REPLACE(${p}, '-', '')`
  }

  const cte = `
    WITH
    user_txn_score AS (
      SELECT t.user_id,
             ROUND(SUM(COALESCE(t.amt, 0) * COALESCE(sp.score, 0))::numeric, 4)             AS txn_score,
             COALESCE(SUM(CASE WHEN t.amt IS NOT NULL AND t.amt < 100000 THEN t.amt::bigint ELSE 0 END), 0) AS txn_cnt
      FROM source_txn t
      LEFT JOIN score_point sp ON sp.prod_name = t.product_name AND sp.is_active = true
      WHERE t.is_active = true
        AND t.user_id ~ '^BCEL[0-9]+$'
        AND t.product_name IS NOT NULL
        ${scoreDateCond}
      GROUP BY t.user_id
    ),
    txn_weight AS (
      SELECT COALESCE(MAX(score), 1) AS weight
      FROM mst_weighted_score
      WHERE LOWER(TRIM(name)) = 'transaction' AND is_active = true
    ),
    dp_max AS (
      SELECT COALESCE(MAX(score), 0) AS score FROM discipline_percented WHERE is_active = true
    ),
    txn_agg AS (
      SELECT user_id,
        COALESCE(SUM(CASE WHEN amt IS NOT NULL AND amt < 100000 THEN amt::bigint ELSE 0 END), 0) AS total,
        MAX(dys) AS dys
      FROM source_txn
      WHERE ${txnDateCond}
      GROUP BY user_id
    ),
    rrscr_base AS (
      SELECT mt.user_code,
        COALESCE(t.total,          0) AS txn_count,
        COALESCE(r.reverse_counts, 0) AS reverse_count,
        COALESCE(c.recor_count,    0) AS recor_count
      FROM master_teller mt
      LEFT JOIN txn_agg               t ON t.user_id   = mt.user_code
      LEFT JOIN source_teller_reverse r ON r.user_code = mt.user_code AND ${revDateCond}
      LEFT JOIN source_teller_recor   c ON c.user_code = mt.user_code AND ${corDateCond}
      WHERE mt.is_active = true ${rankFilter}
    ),
    rrscr_rates AS (
      SELECT *,
        CASE WHEN txn_count > 0 THEN ROUND((reverse_count::numeric / txn_count) * 100, 4) ELSE 0 END AS txn_reverse_pct,
        CASE WHEN txn_count > 0 THEN ROUND((recor_count::numeric  / txn_count) * 100, 4) ELSE 0 END AS txn_recor_pct
      FROM rrscr_base
    ),
    rrscr_avgs AS (
      SELECT
        ROUND(AVG(NULLIF(txn_reverse_pct, 0)), 4) AS avg_rev_rate,
        ROUND(AVG(NULLIF(txn_recor_pct,   0)), 4) AS avg_cor_rate
      FROM rrscr_rates
    ),
    rrscr_ratios AS (
      SELECT r.*, a.avg_rev_rate,
        CASE WHEN a.avg_rev_rate > 0 THEN ROUND(r.txn_reverse_pct / a.avg_rev_rate, 4) ELSE 0 END AS rev_rate_ratio,
        a.avg_cor_rate,
        CASE WHEN a.avg_cor_rate > 0 THEN ROUND(r.txn_recor_pct  / a.avg_cor_rate, 4) ELSE 0 END AS cor_rate_ratio
      FROM rrscr_rates r CROSS JOIN rrscr_avgs a
    ),
    rrscr AS (
      -- LATERAL joins replace correlated subqueries: one lookup per row instead of per-row per-query
      SELECT rr.user_code, rr.reverse_count, rr.recor_count,
        COALESCE(rev_lkp.score, dp_max.score, 0) AS score_reverse,
        COALESCE(cor_lkp.score, dp_max.score, 0) AS score_recor
      FROM rrscr_ratios rr
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
    ),
    combined AS (
      SELECT
        t.user_id, mt.fullname, mt.finger_code,
        p.position_name AS position, p.level,
        ms.sector_name  AS sector,
        d.department,
        t.dys   AS day_of_work,
        COALESCE(vts.txn_cnt, 0) AS txn_count,
        COALESCE(a.days_late, 0) + COALESCE(a.days_early_leave, 0) AS attendent_count,
        COALESCE(vts.txn_score, 0) AS txn_score
      FROM txn_agg t
      INNER JOIN master_teller  mt  ON mt.user_code = t.user_id AND mt.is_active = true
      LEFT JOIN department       d   ON d.id  = mt.department_code
      LEFT JOIN master_sector    ms  ON ms.no  = mt.sector_code
      LEFT JOIN source_position  p   ON p.id  = mt.position_code
      LEFT JOIN attendent        a   ON a.user_code = t.user_id AND ${attDateCond}
      LEFT JOIN user_txn_score   vts ON vts.user_id = t.user_id
      WHERE mt.is_active = true ${rankFilter}
    ),
    scored AS (
      SELECT c.*,
        COALESCE(rr.score_reverse, 0) AS reverse_score,
        COALESCE(rr.score_recor,   0) AS recor_score,
        COALESCE(rr.reverse_count, 0) AS rev_count,
        COALESCE(rr.recor_count,   0) AS recor_cnt,
        CASE
          WHEN c.attendent_count = 0   THEN 10
          WHEN c.attendent_count <= 18 THEN 9
          WHEN c.attendent_count <= 25 THEN 8
          WHEN c.attendent_count <= 30 THEN 6
          WHEN c.attendent_count <= 36 THEN 4
          ELSE 0
        END AS discipline_score,
        CASE WHEN c.txn_score >= AVG(c.txn_score) OVER () * 2 THEN 5 ELSE 0 END AS txn_over_avg_score,
        CASE WHEN COALESCE(rr.reverse_count, 0) = 0 THEN 2.5 ELSE 0 END AS rev_bonus,
        CASE WHEN COALESCE(rr.recor_count,   0) = 0 THEN 2.5 ELSE 0 END AS recor_bonus,
        CASE WHEN c.attendent_count = 0 THEN 5 ELSE 0 END AS attendent_score
      FROM combined c
      LEFT JOIN rrscr rr ON rr.user_code = c.user_id
    ),
    with_pro AS (
      SELECT s.*,
        ROUND((s.txn_score / NULLIF(MAX(s.txn_score) OVER (), 0)) * tw.weight, 4) AS pro_score
      FROM scored s CROSS JOIN txn_weight tw
    ),
    final AS (
      SELECT *,
        ROUND(pro_score + discipline_score + txn_over_avg_score +
              rev_bonus + recor_bonus + attendent_score +
              reverse_score + recor_score, 2) AS total_score
      FROM with_pro
    )
  `
  return { cte, params }
}

export async function queryRankTeller(opts: {
  search?:    string
  page?:      number
  pageSize?:  number
  rankId?:    number | null
  deptId?:    number | null
  issueDate?: string | null
}): Promise<{ rows: RankTellerRow[]; total: number; pageCount: number; error?: string }> {
  const { search = '', page = 1, pageSize = 50, rankId = null, deptId = null, issueDate = null } = opts
  const offset = (page - 1) * pageSize

  const { cte, params: baseParams } = buildCte(rankId, deptId, issueDate)
  const params = [...baseParams]

  const searchConds: string[] = []
  if (search) {
    params.push(`%${search}%`)
    searchConds.push(`(user_id ILIKE $${params.length} OR fullname ILIKE $${params.length})`)
  }
  const where = searchConds.length ? `WHERE ${searchConds.join(' AND ')}` : ''

  // COUNT(*) OVER() runs the CTE once instead of twice
  const sql = `
    ${cte}
    SELECT
      ROW_NUMBER() OVER (ORDER BY total_score DESC, txn_count DESC)::integer AS no,
      user_id, fullname, finger_code, position, level, sector, department,
      day_of_work, txn_count, reverse_score, recor_score, attendent_count,
      txn_score, pro_score, discipline_score, txn_over_avg_score,
      rev_bonus, recor_bonus, attendent_score, total_score,
      COUNT(*) OVER () AS _total
    FROM final
    ${where}
    ORDER BY total_score DESC, txn_count DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `

  try {
    const res = await pool.query(sql, [...params, pageSize, offset])
    const total = Number(res.rows[0]?._total ?? 0)
    const rows  = res.rows.map(({ _total: _, ...r }) => r) as RankTellerRow[]
    return { rows, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) }
  } catch (e) {
    return { rows: [], total: 0, pageCount: 1, error: e instanceof Error ? e.message : String(e) }
  }
}
