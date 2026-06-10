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
    const s = await client.query('SELECT key, value, updated_at FROM app_settings ORDER BY key')
    console.log('\n=== app_settings ===')
    s.rows.forEach((r: any) => console.log(' ', r.key, '=', r.value ?? '(null)', '| updated:', r.updated_at))

    const d = await client.query(`
      SELECT DISTINCT issue_date FROM (
        SELECT issue_date FROM source_txn            WHERE issue_date IS NOT NULL AND is_active=true
        UNION
        SELECT issue_date FROM source_teller_reverse WHERE issue_date IS NOT NULL AND is_active=true
        UNION
        SELECT issue_date FROM source_teller_recor   WHERE issue_date IS NOT NULL AND is_active=true
      ) p ORDER BY issue_date DESC
    `)
    console.log('\n=== Available issue_dates ===')
    if (d.rows.length === 0) {
      console.log('  (none — no issue_date data uploaded yet)')
    } else {
      d.rows.forEach((r: any) => {
        const s2 = String(r.issue_date)
        const label = s2.length === 6 ? `${s2.slice(0, 4)}-${s2.slice(4)}` : s2
        console.log(' ', label, `(${r.issue_date})`)
      })
    }

    const txnCount = await client.query('SELECT COUNT(*) n, COUNT(issue_date) with_date FROM source_txn')
    console.log(`\n=== source_txn ===`)
    console.log(`  total: ${txnCount.rows[0].n}, with issue_date: ${txnCount.rows[0].with_date}`)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
