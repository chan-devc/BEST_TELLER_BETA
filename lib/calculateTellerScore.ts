import { pool } from './db'

export interface TellerScoreDetailRow {
  prod_name: string
  cnt:       string
  score:     string
  points:    string
}

export interface TellerScoreSummaryRow {
  user_id:       string
  user_name:     string
  product_count: number
  total_points:  string
  day_of_work:   number
  txn_total:     number
}

export async function queryTellerScore(opts: {
  userId?:    string
  search?:    string
  page?:      number
  pageSize?:  number
  issueDate?: string | null
}): Promise<{
  rows: TellerScoreDetailRow[] | TellerScoreSummaryRow[]
  total: number
  pageCount: number
  error?: string
}> {
  const { userId, search = '', page = 1, pageSize = 50, issueDate = null } = opts
  const offset = (page - 1) * pageSize

  try {
    // ── Per-user detail: product breakdown ───────────────────────────────────
    if (userId) {
      const params: unknown[] = [userId]
      let dateFilter = ''
      if (issueDate !== null) {
        params.push(issueDate)
        dateFilter = `AND t.issue_date = $${params.length}`
      }
      const res = await pool.query(`
        SELECT
          t.product_name                                AS prod_name,
          t.amt::text                                   AS cnt,
          COALESCE(sp.score, 0)::text                   AS score,
          (t.amt * COALESCE(sp.score, 0))::text         AS points
        FROM source_txn t
        LEFT JOIN score_point sp
          ON sp.prod_name = t.product_name AND sp.is_active = true
        WHERE t.user_id = $1
          AND t.is_active = true
          AND t.product_name IS NOT NULL
          ${dateFilter}
        ORDER BY (t.amt * COALESCE(sp.score, 0)) DESC
      `, params)
      return { rows: res.rows, total: res.rows.length, pageCount: 1 }
    }

    // ── Resolve the period to query ───────────────────────────────────────────
    let period = issueDate
    if (!period) {
      const r = await pool.query(
        `SELECT MAX(issue_date) AS d FROM source_txn WHERE is_active = true AND issue_date IS NOT NULL`
      )
      period = r.rows[0]?.d ?? null
    }
    if (!period) return { rows: [], total: 0, pageCount: 1 }

    // ── Summary list ──────────────────────────────────────────────────────────
    const params: unknown[] = [period]
    const searchCond = search
      ? `AND (t.user_id ILIKE $${params.length + 1} OR mt.fullname ILIKE $${params.length + 1})`
      : ''
    if (search) params.push(`%${search}%`)

    const baseSql = `
      FROM source_txn t
      LEFT JOIN master_teller mt ON mt.user_code = t.user_id
      LEFT JOIN score_point   sp ON sp.prod_name = t.product_name AND sp.is_active = true
      WHERE t.is_active = true
        AND t.issue_date = $1
        AND t.user_id ~ '^BCEL[0-9]+$'
        AND t.product_name IS NOT NULL
        ${searchCond}
    `

    const [sumRes, countRes] = await Promise.all([
      pool.query(`
        SELECT
          t.user_id,
          COALESCE(mt.fullname, t.user_id)                                           AS user_name,
          COUNT(DISTINCT t.product_name) FILTER (WHERE t.amt > 0)                   AS product_count,
          ROUND(COALESCE(SUM(t.amt * COALESCE(sp.score, 0)), 0)::numeric, 4)        AS total_points,
          COALESCE(MAX(t.dys), 0)                                                    AS day_of_work,
          COALESCE(SUM(CASE WHEN t.amt < 100000 THEN t.amt ELSE 0 END), 0)::bigint  AS txn_total
        ${baseSql}
        GROUP BY t.user_id, mt.fullname
        ORDER BY total_points DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, pageSize, offset]),

      pool.query(`
        SELECT COUNT(DISTINCT t.user_id)::int AS cnt
        ${baseSql}
      `, params),
    ])

    const total = countRes.rows[0]?.cnt ?? 0
    return {
      rows:      sumRes.rows,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    }

  } catch (e) {
    return { rows: [], total: 0, pageCount: 1, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function calculateTellerScore(): Promise<{ rows: number; error?: string }> {
  try {
    const res = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM source_txn WHERE is_active = true AND product_name IS NOT NULL`
    )
    return { rows: res.rows[0]?.cnt ?? 0 }
  } catch (e) {
    return { rows: 0, error: e instanceof Error ? e.message : String(e) }
  }
}
