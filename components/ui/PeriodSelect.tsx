'use client'

import { fmtPeriod } from '@/lib/format'

interface Props {
  value:      string | null
  options:    string[]
  onChange:   (v: string | null) => void
  allLabel?:  string
}

export default function PeriodSelect({ value, options, onChange, allLabel = '📅 ທຸກ​ໄລ​ຍະ' }: Props) {
  const active = value !== null
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      style={{
        padding: '7px 12px', borderRadius: 8, fontSize: 13,
        border:      `1px solid ${active ? 'var(--red2)' : 'var(--border)'}`,
        background:  active ? 'rgba(200,0,30,.04)' : '#fff',
        color:       active ? 'var(--red2)' : undefined,
        fontWeight:  active ? 600 : undefined,
      }}
    >
      <option value=''>{allLabel}</option>
      {options.map(d => (
        <option key={d} value={d}>{fmtPeriod(d)}</option>
      ))}
    </select>
  )
}
