'use client'

const btn = (disabled: boolean): React.CSSProperties => ({
  padding: '5px 11px', borderRadius: 6, border: '1px solid var(--border)',
  background: disabled ? '#f5f5f5' : '#fff',
  color:      disabled ? '#bbb'    : 'var(--tmid)',
  cursor:     disabled ? 'not-allowed' : 'pointer', fontSize: 12,
})

interface Props {
  page:      number
  pageCount: number
  total?:    number
  onPage:    (p: number) => void
}

export default function Pagination({ page, pageCount, total, onPage }: Props) {
  if (pageCount <= 1) return null
  return (
    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <button onClick={() => onPage(1)}          disabled={page === 1}         style={btn(page === 1)}>«</button>
      <button onClick={() => onPage(page - 1)}   disabled={page === 1}         style={btn(page === 1)}>‹ Prev</button>
      <span style={{ flex: 1, textAlign: 'center', color: 'var(--tmid)', fontSize: 12 }}>
        Page {page} / {pageCount}{total !== undefined ? ` · ${total.toLocaleString()} ລາຍການ` : ''}
      </span>
      <button onClick={() => onPage(page + 1)}   disabled={page === pageCount} style={btn(page === pageCount)}>Next ›</button>
      <button onClick={() => onPage(pageCount)}  disabled={page === pageCount} style={btn(page === pageCount)}>»</button>
    </div>
  )
}
