import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local manually (dotenv not installed)
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🚀 Running database migration...\n')

    // Run each .sql file in scripts/ that starts with "migrate"
    const files = ['migrate.sql', 'migrate_data_source.sql', 'migrate_issue_date_varchar.sql', 'migrate_views.sql', 'migrate_score_point.sql']
    for (const f of files) {
      const sqlPath = path.resolve(__dirname, f)
      if (!fs.existsSync(sqlPath)) {
        console.log(`  ⏭️  Skip ${f} (not found)`)
        continue
      }
      console.log(`  ▶ Running ${f}...`)
      const sql = fs.readFileSync(sqlPath, 'utf8')
      await client.query(sql)
      console.log(`  ✅ ${f}`)
    }
    console.log('\n✅ Migration complete!')
  } catch (err) {
    console.error('❌ Migration error:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(err => {
  console.error('\n💥 Fatal migration error:')
  console.error(err)
  if (err && typeof err === 'object') {
    if ('detail' in err)   console.error('  detail:',   (err as { detail: unknown }).detail)
    if ('hint' in err)     console.error('  hint:',     (err as { hint: unknown }).hint)
    if ('position' in err) console.error('  position:', (err as { position: unknown }).position)
    if ('code' in err)     console.error('  code:',     (err as { code: unknown }).code)
    if ('routine' in err)  console.error('  routine:',  (err as { routine: unknown }).routine)
  }
  process.exit(1)
})
