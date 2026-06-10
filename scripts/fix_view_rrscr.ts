import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const t = line.trim()
    if (!t || t.startsWith('#')) return
    const eq = t.indexOf('=')
    if (eq === -1) return
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    if (k && !(k in process.env)) process.env[k] = v
  })
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Shared period CTE + filtered JOIN snippet
const PERIOD_CTE = `
  active_period AS (
    SELECT COALESCE(
      (SELECT value::integer FROM app_settings WHERE key = 'approved_issue_date' LIMIT 1),
      (SELECT MAX(issue_date) FROM source_txn WHERE is_active = true AND issue_date IS NOT NULL)
    ) AS issue_date
  ),`

const baseCols = (deptFilter: string) => `
  SELECT mt.user_code, mt.fullname, d.department,
    ${deptFilter},
    t.issue_date,
    COALESCE(t.total,          0) AS txn_count,
    COALESCE(r.reverse_counts, 0) AS reverse_count,
    COALESCE(c.recor_count,    0) AS recor_count
  FROM master_teller mt
  CROSS JOIN active_period p
  LEFT JOIN department d ON d.id = mt.department_code
  LEFT JOIN source_txn t
         ON t.user_id   = mt.user_code AND t.is_active = true AND t.user_id <> 'BCELONE'
        AND (p.issue_date IS NULL OR t.issue_date = p.issue_date)
  LEFT JOIN source_teller_reverse r
         ON r.user_code = mt.user_code AND r.is_active = true
        AND (p.issue_date IS NULL OR r.issue_date = p.issue_date)
  LEFT JOIN source_teller_recor c
         ON c.user_code = mt.user_code AND c.is_active = true
        AND (p.issue_date IS NULL OR c.issue_date = p.issue_date)
  WHERE mt.is_active = true`

const sharedCTEs = `
rates  AS (SELECT *,
    CASE WHEN txn_count>0 THEN ROUND((reverse_count::numeric/txn_count)*100,4) ELSE 0 END AS txn_reverse_pct,
    CASE WHEN txn_count>0 THEN ROUND((recor_count::numeric/txn_count)*100,4)  ELSE 0 END AS txn_recor_pct
  FROM base),
avgs   AS (SELECT
    ROUND(AVG(NULLIF(txn_reverse_pct,0)),4) AS avg_rev_rate,
    ROUND(AVG(NULLIF(txn_recor_pct,  0)),4) AS avg_cor_rate
  FROM rates),
ratios AS (SELECT r.*,a.avg_rev_rate,
    CASE WHEN a.avg_rev_rate>0 THEN ROUND(r.txn_reverse_pct/a.avg_rev_rate,4) ELSE 0 END AS rev_rate_ratio,
    a.avg_cor_rate,
    CASE WHEN a.avg_cor_rate>0 THEN ROUND(r.txn_recor_pct/a.avg_cor_rate,4)  ELSE 0 END AS cor_rate_ratio
  FROM rates r CROSS JOIN avgs a),
final AS (SELECT rr.*,
    COALESCE(
      (SELECT dp.score FROM discipline_percented dp WHERE dp.is_active=true AND dp.percented<=rr.rev_rate_ratio ORDER BY dp.percented DESC LIMIT 1),
      (SELECT dp.score FROM discipline_percented dp WHERE dp.is_active=true ORDER BY dp.score DESC LIMIT 1),0) AS score_reverse,
    COALESCE(
      (SELECT dp.score FROM discipline_percented dp WHERE dp.is_active=true AND dp.percented<=rr.cor_rate_ratio ORDER BY dp.percented DESC LIMIT 1),
      (SELECT dp.score FROM discipline_percented dp WHERE dp.is_active=true ORDER BY dp.score DESC LIMIT 1),0) AS score_recor
  FROM ratios rr)`

const SELECT_COLS = `
SELECT ROW_NUMBER() OVER(ORDER BY rev_rate_ratio ASC,cor_rate_ratio ASC,user_code)::integer AS no,
       user_code,fullname,department,branch_code,issue_date,txn_count,reverse_count,recor_count,
       txn_reverse_pct,avg_rev_rate,rev_rate_ratio,txn_recor_pct,avg_cor_rate,cor_rate_ratio,score_reverse,score_recor
FROM final ORDER BY rev_rate_ratio ASC,cor_rate_ratio ASC,user_code`

const HV_DEPT = `'ສູນບໍລິການ','ພະແນກການຕະຫຼາດ ແລະ ບໍລິການລູກຄ້າລາຍໃຫຍ່','ສາຂານະຄອນຫຼວງວຽງຈັນ','ສາຂາ ດົງໂດກ','ສາຂາໄຊເສດຖາ'`

async function run() {
  const client = await pool.connect()
  try {
    // 1. view_reverse_recor_score — all branches
    await client.query(`DROP VIEW IF EXISTS view_reverse_recor_score CASCADE`)
    await client.query(`
      CREATE VIEW view_reverse_recor_score AS
      WITH ${PERIOD_CTE}
      base AS (${baseCols(`
        CASE WHEN d.department IN (${HV_DEPT}) THEN 'HV' ELSE d.department END AS branch_code`)}
      ),
      ${sharedCTEs}
      ${SELECT_COLS}
    `)
    console.log('✅ view_reverse_recor_score updated')

    // 2. view_rrscr_hv — HV only
    await client.query(`DROP VIEW IF EXISTS view_rrscr_hv CASCADE`)
    await client.query(`
      CREATE VIEW view_rrscr_hv AS
      WITH ${PERIOD_CTE}
      base AS (${baseCols(`'HV' AS branch_code`)}
        AND d.department IN (${HV_DEPT})
      ),
      ${sharedCTEs}
      ${SELECT_COLS}
    `)
    console.log('✅ view_rrscr_hv updated')

    // 3. view_rrscr_non_hv — non-HV combined
    await client.query(`DROP VIEW IF EXISTS view_rrscr_non_hv CASCADE`)
    await client.query(`
      CREATE VIEW view_rrscr_non_hv AS
      WITH ${PERIOD_CTE}
      base AS (${baseCols(`d.department AS branch_code`)}
        AND d.department NOT IN (${HV_DEPT})
      ),
      ${sharedCTEs}
      ${SELECT_COLS}
    `)
    console.log('✅ view_rrscr_non_hv updated')

    // Verify
    const r = await client.query(`SELECT no,user_code,issue_date,score_reverse,score_recor FROM view_reverse_recor_score LIMIT 3`)
    console.log('\nSample from view_reverse_recor_score:')
    r.rows.forEach((row: any) => console.log(' ', row.user_code, 'issue_date:', row.issue_date, 'rev:', row.score_reverse, 'cor:', row.score_recor))
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
