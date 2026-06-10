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
    const t1 = await client.query('SELECT COUNT(*)::int n FROM master_teller WHERE is_active=true')
    console.log('Total active tellers:', t1.rows[0].n)

    const t2 = await client.query(`SELECT value FROM app_settings WHERE key='approved_issue_date' LIMIT 1`)
    console.log('Approved period:', t2.rows[0]?.value ?? '(none)')

    // Score distribution
    const dist = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE total >= 100)  AS gte_100,
        COUNT(*) FILTER (WHERE total < 100)   AS lt_100,
        COUNT(*) total_users,
        MIN(total) min_score,
        MAX(total) max_score,
        ROUND(AVG(total)::numeric,2) avg_score
      FROM (
        SELECT user_id, ROUND(SUM(points)::numeric,2) AS total
        FROM view_teller_score
        GROUP BY user_id
      ) sub
    `)
    const d = dist.rows[0]
    console.log('\n--- Score distribution ---')
    console.log('Users with score >= 100:', d.gte_100)
    console.log('Users with score < 100: ', d.lt_100)
    console.log('Total users in view:    ', d.total_users)
    console.log('Min score:', d.min_score, '| Max:', d.max_score, '| Avg:', d.avg_score)

    // Bottom 5 scores
    const bot = await client.query(`
      SELECT user_id, ROUND(SUM(points)::numeric,2) AS total
      FROM view_teller_score GROUP BY user_id ORDER BY total ASC LIMIT 5
    `)
    console.log('\nBottom 5:', bot.rows.map((r: any) => `${r.user_id}=${r.total}`).join(', '))
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(console.error)
