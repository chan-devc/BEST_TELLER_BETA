'use client'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const COLORS = {
  success: { border: 'rgba(11,158,94,.3)', dot: 'var(--green)' },
  error:   { border: 'rgba(200,0,30,.3)', dot: 'var(--red)' },
  info:    { border: 'rgba(201,154,0,.3)', dot: 'var(--gold2)' },
}

export default function Toast({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 7 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: '#fff', border: `1px solid ${COLORS[t.type].border}`,
          borderRadius: 12, padding: '11px 16px', fontSize: 14, fontWeight: 500,
          color: 'var(--text)', boxShadow: '0 8px 28px rgba(0,0,0,.12)',
          display: 'flex', alignItems: 'center', gap: 9, minWidth: 220,
          animation: 'slideIn .3s ease',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: COLORS[t.type].dot }} />
          {t.message}
        </div>
      ))}
      <style>{`@keyframes slideIn{from{transform:translateX(110%)}to{transform:translateX(0)}}`}</style>
    </div>
  )
}
