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

async function run() {
  const client = await pool.connect()
  try {
    await client.query(`DROP VIEW IF EXISTS view_teller_score CASCADE`)

    await client.query(`
      CREATE VIEW view_teller_score AS
      WITH active_period AS (
        SELECT COALESCE(
          (SELECT value::integer FROM app_settings WHERE key = 'approved_issue_date' LIMIT 1),
          (SELECT MAX(issue_date) FROM source_txn WHERE is_active = true AND issue_date IS NOT NULL)
        ) AS issue_date
      ),
      filtered_txn AS (
        SELECT t.* FROM source_txn t, active_period p
        WHERE t.is_active = true
          AND t.user_id ~ '^BCEL[0-9]+$'
          AND (p.issue_date IS NULL OR t.issue_date = p.issue_date)
      ),
      unpivot AS (
        SELECT t.user_id,t.user_name,t.issue_date,'CUP' AS prod_name,t.cup AS cnt FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'CUP VIRTUAL',t.cup_virtual FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'INTER CARD',t.inter_card FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'PAYCARD',t.paycard FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'B1',t.b1_b1_dup FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'IBANK',t.ibank FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'SMS',t.sms FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'ONEPAY',t.onepay FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'ONEPAY RP',t.onepay_replace FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'EDC',t.edc FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'AC_OPN',t.ac_opn FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'AC_CLS',t.ac_cls FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'CASH DPS',t.cash_dps FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'CASH OUT',t.cash_out FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'TRF',t.trf FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'SMVAT',t.smvat FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'P2P',t.p2p FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'DOMES TRF',t.domes_trf FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'INTER TRF',t.inter_trf FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'SAL',t.sal FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'CHEQUE',t.cheque::int FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'EXCH',t.exch FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'LOAN',t.loan FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'C1_MG',t.c1_mg FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'CASSIC MG',t.cassic_mg FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'B1_MG',t.b1_mg FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'IB_MG',t.ib_mg FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'ExtraScore',t.extra_score FROM filtered_txn t UNION ALL
        SELECT t.user_id,t.user_name,t.issue_date,'OTH',t.oth FROM filtered_txn t
      )
      SELECT u.user_id, u.user_name, u.issue_date, u.prod_name,
             COALESCE(u.cnt,0)                       AS cnt,
             COALESCE(sp.score,0)                    AS score,
             COALESCE(u.cnt,0)*COALESCE(sp.score,0)  AS points
      FROM unpivot u
      LEFT JOIN score_point sp ON sp.prod_name = u.prod_name AND sp.is_active = true
    `)

    console.log('✅ view_teller_score recreated with issue_date column')

    const r = await client.query('SELECT user_id, issue_date, prod_name, cnt, points FROM view_teller_score LIMIT 3')
    console.log('Sample rows:', r.rows)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
