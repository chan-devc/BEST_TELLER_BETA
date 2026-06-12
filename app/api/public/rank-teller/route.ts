export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

// ── Column indices (0-based) confirmed from file structure ───────────────────
// Row 0: section headers  (ລາຍລະອຽດ, ສະເລ່ຍທຸລະກໍາ …)
// Row 1: sub-headers      (Day, Txn/day, ຄ່າສະເລ່ຍ …)
// Row 2: column labels    (No., User, ຊື່ ແລະ ນາມສະກຸນ … 70 20 10 5 2.5 …)
// Row 3+: data rows
const C = {
  no:                0,
  user_id:           1,
  fullname:          2,
  position:          3,
  level:             4,
  // col 5 = role (Bank teller) — skipped
  sector:            6,
  department:        7,
  day_of_work:       8,
  txn_per_day:       9,   // ທຸລະກໍາ/ມື້  → ຄະແນນທຸລະກຳ (J4 ≈ 44.22 in 04.2026)
  avg_score_total:  10,   // ຄ່າສະເລ່ຍ ຄະແນນລວມ
  rev_cor_count:    11,   // ຄ່າສະເລ່ຍ Rev+Cor
  late_count:       12,   // ຈໍານວນຄັ້ງ ມາຊ້າ+ກັບໄວ
  weight_txn:       13,   // 70% weight (kept for reference)
  reverse_score:    14,   // 20% weight
  discipline_score: 15,   // 10% weight
  txn_over_avg:     16,   // bonus 5
  rev_bonus:        17,   // bonus 2.5
  recor_bonus:      18,   // bonus 2.5
  attendent_score:  19,   // bonus 5
  total_score:      20,   // Final Score
} as const

// ── Helpers ──────────────────────────────────────────────────────────────────
const num = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return isFinite(v) ? v : 0
  const n = parseFloat(String(v).replace(/,/g, ''))
  return isFinite(n) ? n : 0
}
const str = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

// ── Filename → issue_date ─────────────────────────────────────────────────
// "03.2026v1.xlsx" → "2026-03"
function parseIssueDateFromFile(filename: string): string | null {
  const m = filename.match(/^(\d{2})\.(\d{4})/)
  if (!m) return null
  return `${m[2]}-${m[1]}`
}

// ── Scan file/ directory ──────────────────────────────────────────────────
function scanFiles(): { issueDate: string; filePath: string; filename: string }[] {
  const dir = path.join(process.cwd(), 'file')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => /\.xlsx$/i.test(f))
    .flatMap(f => {
      const d = parseIssueDateFromFile(f)
      return d ? [{ issueDate: d, filePath: path.join(dir, f), filename: f }] : []
    })
    .sort((a, b) => {
      // Sort same period by version desc (v2 > v1), then by date desc
      if (a.issueDate === b.issueDate) return b.filename.localeCompare(a.filename)
      return b.issueDate.localeCompare(a.issueDate)
    })
}

// ── Load finger_code lookup from file/finger_codes.json ──────────────────
function loadFingerCodes(): Record<string, string> {
  try {
    const p = path.join(process.cwd(), 'file', 'finger_codes.json')
    if (!fs.existsSync(p)) return {}
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, string>
  } catch { return {} }
}

// ── Read one cell by row/col index ────────────────────────────────────────
function cellVal(ws: XLSX.WorkSheet, r: number, c: number): unknown {
  const cell = ws[XLSX.utils.encode_cell({ r, c })]
  if (!cell || cell.t === 'z' || cell.v === undefined || cell.v === '') return null
  return cell.v
}

// ── Count distinct departments and get first department/sector name from a sheet ────
function countSheetRows(ws: XLSX.WorkSheet | undefined): { count: number; sectorName: string | null; deptName: string | null } {
  if (!ws) return { count: 0, sectorName: null, deptName: null }
  const ref = ws['!ref']
  if (!ref) return { count: 0, sectorName: null, deptName: null }
  const range = XLSX.utils.decode_range(ref)
  const depts = new Set<string>()
  let sectorName: string | null = null
  let deptName: string | null = null
  for (let r = 3; r <= range.e.r; r++) {
    const uid    = cellVal(ws, r, C.user_id)
    const dept   = cellVal(ws, r, C.department)
    const sector = cellVal(ws, r, C.sector)
    if (uid && dept) {
      depts.add(String(dept).trim())
      if (!deptName) deptName = String(dept).trim()
    }
    if (!sectorName && uid && sector) sectorName = String(sector).trim()
  }
  return { count: depts.size, sectorName, deptName }
}

// ── Parse ranking rows from a sheet (data starts at row index 3) ──────────
interface RankRow {
  no: number
  user_id: string
  fullname: string
  finger_code: string | null
  position: string
  level: string
  sector: string
  department: string
  day_of_work: number
  weight_txn: number
  txn_count: number
  txn_score: number
  pro_score: number
  reverse_score: number
  recor_score: number
  discipline_score: number
  txn_over_avg_score: number
  rev_bonus: number
  recor_bonus: number
  attendent_score: number
  total_score: number
}

function parseSheetRows(ws: XLSX.WorkSheet, search: string): RankRow[] {
  const ref = ws['!ref']
  if (!ref) return []
  const range = XLSX.utils.decode_range(ref)
  const DATA_START = 3
  const lc = search.toLowerCase()

  const rows: RankRow[] = []
  for (let r = DATA_START; r <= range.e.r; r++) {
    const g = (c: number) => cellVal(ws, r, c)

    const no      = g(C.no)
    const user_id = g(C.user_id)
    // Skip blank / footer rows
    if (!no && !user_id) continue
    const uid = str(user_id)
    if (!uid) continue

    const fullname = str(g(C.fullname))

    // Apply search filter here (cheaper than after building the object)
    if (lc && !uid.toLowerCase().includes(lc) && !fullname.toLowerCase().includes(lc)) continue

    rows.push({
      no:                  num(no),
      user_id:             uid,
      fullname,
      finger_code:         null,
      position:            str(g(C.position)),
      level:               str(g(C.level)),
      sector:              str(g(C.sector)),
      department:          str(g(C.department)),
      day_of_work:         num(g(C.day_of_work)),
      weight_txn:         num(g(C.weight_txn)),
      txn_count:           num(g(C.txn_per_day)),
      txn_score:           num(g(C.avg_score_total)),
      pro_score:           num(g(C.total_score)),
      reverse_score:       num(g(C.reverse_score)),
      recor_score:         0,
      discipline_score:    num(g(C.discipline_score)),
      txn_over_avg_score:  num(g(C.txn_over_avg)),
      rev_bonus:           num(g(C.rev_bonus)),
      recor_bonus:         num(g(C.recor_bonus)),
      attendent_score:     num(g(C.attendent_score)),
      total_score:         num(g(C.total_score)),
    })
  }
  return rows
}

// ── Sheet-name → rank label ───────────────────────────────────────────────
function sheetLabel(name: string): string {
  return name.replace(/^Rank\s+/i, '').trim() || name
}

// ── GET handler ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp          = req.nextUrl.searchParams
  const rankIdRaw   = sp.get('rankId') ?? ''
  const issueDateRaw= sp.get('issueDate') ?? ''
  const search      = (sp.get('search') ?? '').trim()
  const rankId      = rankIdRaw ? parseInt(rankIdRaw, 10) : 1

  // ── Scan available files ────────────────────────────────────────────────
  const files = scanFiles()
  if (files.length === 0) {
    return NextResponse.json({
      rows: [], ranks: [], departments: [],
      approved_period: null, not_announced: true, issue_dates: [],
    })
  }

  // Unique issue_dates (no duplicates — same period may have v1/v2)
  const issueDates = [...new Set(files.map(f => f.issueDate))]

  // Pick the requested period, or fall back to most recent
  const activePeriod = (issueDateRaw && issueDates.includes(issueDateRaw))
    ? issueDateRaw
    : issueDates[0]

  // Among files for this period pick the latest version (first after sort)
  const fileEntry = files.find(f => f.issueDate === activePeriod)!

  // ── Load workbook ───────────────────────────────────────────────────────
  let wb: XLSX.WorkBook
  try {
    const buf = fs.readFileSync(fileEntry.filePath)
    wb = XLSX.read(buf, { type: 'buffer' })
  } catch {
    return NextResponse.json({ error: 'Cannot read file' }, { status: 500 })
  }

  // ── Build ranks list from rank sheets only (exclude data sheets like 2.2.Reverse) ────────
  const rankSheetNames = wb.SheetNames.filter(n => /^Rank_/i.test(n))
  const ranks = rankSheetNames.map((name, idx) => {
    const { count, deptName } = countSheetRows(wb.Sheets[name])
    return {
      id:         idx + 1,
      group_name: name,
      dept_count: count,
      dept_name:  deptName,
    }
  })

  // ── Select sheet by rankId ───────────────────────────────────────────────
  const sheetIndex = Math.max(0, rankId - 1)
  const sheetName  = rankSheetNames[sheetIndex] ?? rankSheetNames[0]
  const ws         = wb.Sheets[sheetName]

  const fingerCodes = loadFingerCodes()
  const rows = ws
    ? parseSheetRows(ws, search)
        .sort((a, b) => b.total_score - a.total_score)
        .map((r, i) => ({ ...r, no: i + 1, finger_code: fingerCodes[r.user_id] ?? null }))
    : []

  return NextResponse.json({
    rows,
    ranks,
    departments:     [],
    approved_period: activePeriod,
    active_period:   activePeriod,
    issue_dates:     issueDates,
    not_announced:   false,
  })
}
