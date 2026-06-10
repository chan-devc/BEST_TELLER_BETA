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
    await client.query(`
      CREATE TABLE IF NOT EXISTS best_teller_approvals (
        id          SERIAL PRIMARY KEY,
        issue_date  INTEGER      NOT NULL,
        note        TEXT,
        approved_by INTEGER      REFERENCES admin_users(id) ON DELETE SET NULL,
        approved_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bta_approved_at ON best_teller_approvals(approved_at DESC)`)
    console.log('✅ best_teller_approvals table created')
    const r = await client.query('SELECT COUNT(*)::int n FROM best_teller_approvals')
    console.log('   rows:', r.rows[0].n)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
