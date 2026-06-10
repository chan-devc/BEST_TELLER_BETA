// Shared pure formatting helpers — import from here, not re-define per file

export const fmtPeriod = (d: number | string | null | undefined): string => {
  if (!d) return '—'
  const s = String(d)
  return s.length === 6 ? `${s.slice(0, 4)}-${s.slice(4)}` : s
}

export const fmtNum = (v: unknown, decimals = 2): string => {
  const n = Number(v)
  return isNaN(n) ? String(v ?? '·')
    : n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export const fmtPct = (v: unknown): string => {
  const n = Number(v)
  return isNaN(n) ? String(v ?? '·') : fmtNum(n, 2) + '%'
}

export const fmtRatio = (v: unknown): string => {
  const n = Number(v)
  return isNaN(n) ? String(v ?? '·') : fmtNum(n * 100, 2) + '%'
}
