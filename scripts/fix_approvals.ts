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
    // Add status column
    await client.query(`
      ALTER TABLE best_teller_approvals
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'inactive'
    `)
    console.log('✅ Added status column')

    // Set the most recent record as active (matches current app_settings)
    const setting = await client.query(`SELECT value FROM app_settings WHERE key='approved_issue_date' LIMIT 1`)
    if (setting.rows.length > 0) {
      const approved = setting.rows[0].value
      // Set all to inactive first
      await client.query(`UPDATE best_teller_approvals SET status='inactive'`)
      // Set the matching record to active
      await client.query(
        `UPDATE best_teller_approvals SET status='active' WHERE issue_date=$1
         AND id=(SELECT id FROM best_teller_approvals WHERE issue_date=$1 ORDER BY approved_at DESC LIMIT 1)`,
        [parseInt(approved, 10)]
      )
      console.log('✅ Set active record for issue_date:', approved)
    }

    const rows = await client.query('SELECT id, issue_date, approved_at, approved_by_name, status FROM best_teller_approvals ORDER BY approved_at DESC')
    console.log('Records:', rows.rows)
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
