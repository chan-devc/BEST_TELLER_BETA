'use client'

import React, { useState, useEffect, useRef, useCallback, type RefObject } from 'react'

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
// Re-runs when deps change so newly-rendered elements (after data loads) are observed
function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    // Small delay lets React finish rendering new elements before we query them
    const timer = setTimeout(() => {
      const els = document.querySelectorAll<Element>('.reveal, .reveal-l, .reveal-r')
      if (!els.length) return
      const io = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
        }),
        { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
      )
      els.forEach(el => io.observe(el))
      return () => io.disconnect()
    }, 120)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ── 3D tilt hook ────────────────────────────────────────────────────────────
function useTilt(ref: RefObject<HTMLDivElement>) {
  const onMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale3d(1.03,1.03,1.03)`
  }, [ref])
  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'rotateY(0deg) rotateX(0deg) scale3d(1,1,1)'
  }, [ref])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [onMove, onLeave])
}

const empPhoto = (fingerCode: string | null | undefined) =>
  fingerCode ? `http://10.0.2.140:8687/api/employee/img?eid=${fingerCode}` : null

function EmpPhoto({
  fingerCode, name, size, border = '2px solid #fff', shadow, onZoom,
}: {
  fingerCode: string | null | undefined
  name: string
  size: number
  border?: string
  shadow?: string
  onZoom?: (src: string) => void
}) {
  const [failed, setFailed] = React.useState(false)
  const url = empPhoto(fingerCode)
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        className="emp-photo"
        style={{ width: size, height: size, border, boxShadow: shadow, flexShrink: 0, borderRadius: '50%', objectFit: 'contain', background: '#fff', cursor: onZoom ? 'zoom-in' : undefined }}
        onError={() => setFailed(true)}
        onClick={onZoom ? () => onZoom(url) : undefined}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(183,17,19,.15)', border: `${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 900, color: '#b71113',
        fontFamily: "'Noto Sans Lao',serif",
        cursor: onZoom ? 'zoom-in' : undefined,
      }}
      onClick={onZoom && url ? () => onZoom(url) : undefined}
    >
      {initial}
    </div>
  )
}

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
  txn_count: number | string
  txn_score: number | string
  pro_score: number | string
  discipline_score: number | string
  txn_over_avg_score: number | string
  rev_bonus: number | string
  recor_bonus: number | string
  attendent_score: number | string
  reverse_score: number | string
  recor_score: number | string
  total_score: number | string
}

interface RankItem { id: number; group_name: string; dept_count: number; dept_name: string | null }
interface DeptItem { id: number; department: string }

const fmt = (v: number | string, d = 2) => {
  const n = Number(v)
  return isNaN(n) ? String(v) : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

const fmtUnit = (s: string | null | undefined) =>
  s ? s.replace(/^(ຂະແໜງ|ໜ່ວຍ|ໜວ່ຍ)\s+/, '$1') : s

// ── SVG icon library ────────────────────────────────────────────────────────
const Ico = {
  medal:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  trophy:   (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  users:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  building: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9l9-6 9 6"/><line x1="9" y1="21" x2="9" y2="12"/><line x1="15" y1="21" x2="15" y2="12"/></svg>,
  chart:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  settings: (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  star:     (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  sparkle:  (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>,
  globe:    (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  award:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>,
  table:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
  mappin:   (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  chevL:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevLL:   (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>,
  chevRR:   (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>,
  no1: (s=28,c='#D4A017') => <svg width={s} height={s} viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill={c} opacity=".15"/><circle cx="14" cy="14" r="11" fill={c} opacity=".25"/><text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fill={c} fontFamily='Vidaloka,serif'>1</text></svg>,
  no2: (s=28,c='#7A8FA6') => <svg width={s} height={s} viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill={c} opacity=".15"/><circle cx="14" cy="14" r="11" fill={c} opacity=".25"/><text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fill={c} fontFamily='Vidaloka,serif'>2</text></svg>,
  no3: (s=28,c='#b71113') => <svg width={s} height={s} viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill={c} opacity=".15"/><circle cx="14" cy="14" r="11" fill={c} opacity=".25"/><text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="900" fill={c} fontFamily='Vidaloka,serif'>3</text></svg>,
}

// ── Realistic medal SVGs (matches reference image) ─────────────────────────

function MedalIcon({ rank, size = 72 }: { rank: 1|2|3; size?: number }) {
  const cfg = {
    1: { c1:'#FFF9C4',c2:'#FFD700',c3:'#C8960A',c4:'#A07000',c5:'#7A5000', rib1:'#CC2222',rib2:'#0044BB' },
    2: { c1:'#FFFFFF', c2:'#E8E8E8',c3:'#C0C0C0',c4:'#909090',c5:'#606060', rib1:'#1144CC',rib2:'#4488FF' },
    3: { c1:'#FFE4C8',c2:'#D4956A',c3:'#B07040',c4:'#885020',c5:'#5A3010', rib1:'#CC2222',rib2:'#AA1111' },
  }[rank]

  const w = size, h = Math.round(w * 1.5)
  const cx = w / 2, cy = w / 2 + w * 0.06
  const R  = w * 0.44   // main circle radius
  const BUMPS = 18      // scalloped edge bumps

  // Scalloped edge path
  const scallop = Array.from({ length: BUMPS * 2 + 1 }, (_, i) => {
    const a = (i / (BUMPS * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? R + w * 0.045 : R + w * 0.01
    return `${i === 0 ? 'M' : 'L'} ${cx + Math.cos(a)*r} ${cy + Math.sin(a)*r}`
  }).join(' ') + ' Z'

  // Ribbon dimensions
  const ry = cy + R + w * 0.03
  const rb = h - w * 0.03

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`m${rank}-face`} cx="35%" cy="28%" r="75%">
          <stop offset="0%"   stopColor={cfg.c1}/>
          <stop offset="25%"  stopColor={cfg.c2}/>
          <stop offset="55%"  stopColor={cfg.c3}/>
          <stop offset="80%"  stopColor={cfg.c4}/>
          <stop offset="100%" stopColor={cfg.c5}/>
        </radialGradient>
        <radialGradient id={`m${rank}-edge`} cx="35%" cy="28%" r="75%">
          <stop offset="0%"   stopColor={cfg.c2}/>
          <stop offset="60%"  stopColor={cfg.c4}/>
          <stop offset="100%" stopColor={cfg.c5}/>
        </radialGradient>
        <filter id={`m${rank}-sh`}><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(0,0,0,.4)"/></filter>
      </defs>

      {/* Ribbon left tail */}
      <path d={`M ${cx-w*0.04} ${ry} L ${cx-w*0.38} ${rb} L ${cx-w*0.22} ${rb} L ${cx+w*0.02} ${ry+w*0.22} Z`}
        fill={cfg.rib1} opacity=".92"/>
      <path d={`M ${cx-w*0.04} ${ry} L ${cx-w*0.38} ${rb}`}
        stroke="rgba(255,255,255,.25)" strokeWidth={w*0.012} fill="none"/>
      {/* Ribbon right tail */}
      <path d={`M ${cx+w*0.04} ${ry} L ${cx+w*0.38} ${rb} L ${cx+w*0.22} ${rb} L ${cx-w*0.02} ${ry+w*0.22} Z`}
        fill={cfg.rib2} opacity=".92"/>
      <path d={`M ${cx+w*0.04} ${ry} L ${cx+w*0.38} ${rb}`}
        stroke="rgba(255,255,255,.25)" strokeWidth={w*0.012} fill="none"/>
      {/* Ribbon knot */}
      <ellipse cx={cx} cy={ry+w*0.04} rx={w*0.14} ry={w*0.08}
        fill={rank===2?cfg.rib1:cfg.rib1} stroke="rgba(0,0,0,.15)" strokeWidth={w*0.01}/>

      {/* Drop shadow */}
      <path d={scallop} fill="rgba(0,0,0,.22)" filter={`url(#m${rank}-sh)`} transform="translate(1,3)"/>

      {/* Rank 1 glow ring */}
      {rank === 1 && <circle cx={cx} cy={cy} r={R + w*0.07} fill="none" stroke="rgba(255,215,0,.35)" strokeWidth={w*0.025} opacity=".7"/>}

      {/* Scalloped edge */}
      <path d={scallop} fill={`url(#m${rank}-edge)`} stroke={rank===1?'rgba(255,220,0,.4)':rank===2?'rgba(200,200,200,.3)':'rgba(180,120,60,.3)'} strokeWidth={w*0.01}/>

      {/* Main coin face */}
      <circle cx={cx} cy={cy} r={R} fill={`url(#m${rank}-face)`}/>

      {/* Concentric rings for metallic spinning effect */}
      {[0.88,0.76,0.62,0.46,0.28].map((f, i) => (
        <circle key={i} cx={cx} cy={cy} r={R*f}
          fill="none" stroke={i%2===0?'rgba(255,255,255,.22)':'rgba(0,0,0,.12)'}
          strokeWidth={w*0.012}/>
      ))}

      {/* Shine highlight */}
      <ellipse cx={cx-R*0.22} cy={cy-R*0.28} rx={R*0.45} ry={R*0.22}
        fill="rgba(255,255,255,.38)"/>
      <ellipse cx={cx+R*0.35} cy={cy+R*0.35} rx={R*0.18} ry={R*0.10}
        fill="rgba(255,255,255,.18)"/>

      {/* Edge ring */}
      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke="rgba(255,255,255,.3)" strokeWidth={w*0.018}/>
      <circle cx={cx} cy={cy} r={R*0.96} fill="none"
        stroke={cfg.c5} strokeWidth={w*0.01} opacity=".4"/>

      {/* Rank number — auto */}
      <text x={cx} y={cy + w*0.15} textAnchor="middle"
        fontSize={w * 0.40} fontWeight="900" fill={cfg.c5}
        fontFamily="'Vidaloka',serif" opacity=".75">{rank}</text>
    </svg>
  )
}

const MEDAL_SVGS = [
  (s: number) => <MedalIcon rank={1} size={s} />,
  (s: number) => <MedalIcon rank={2} size={s} />,
  (s: number) => <MedalIcon rank={3} size={s} />,
]

// ── Award badge for ranks > 3 with score >= 100 ──────────────────────────────
function AwardBadge({ no, size = 36 }: { no: number; size?: number }) {
  // Same scalloped medal style as MedalIcon, gold, with rank number
  const w = size, h = Math.round(w * 1.5)
  const cx = w / 2, cy = w / 2 + w * 0.06
  const R = w * 0.44, BUMPS = 18
  const scallop = Array.from({ length: BUMPS*2+1 }, (_, i) => {
    const a = (i/(BUMPS*2))*Math.PI*2 - Math.PI/2
    const r = i%2===0 ? R+w*0.045 : R+w*0.01
    return `${i===0?'M':'L'} ${cx+Math.cos(a)*r} ${cy+Math.sin(a)*r}`
  }).join(' ') + ' Z'
  const ry = cy+R+w*0.03, rb = h-w*0.03
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`ab${no}-f`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#FFF9C4"/><stop offset="25%" stopColor="#FFD700"/>
          <stop offset="55%" stopColor="#C8960A"/><stop offset="100%" stopColor="#7A5000"/>
        </radialGradient>
      </defs>
      <path d={`M ${cx-w*0.04} ${ry} L ${cx-w*0.38} ${rb} L ${cx-w*0.22} ${rb} L ${cx+w*0.02} ${ry+w*0.22} Z`} fill="#CC2222" opacity=".9"/>
      <path d={`M ${cx+w*0.04} ${ry} L ${cx+w*0.38} ${rb} L ${cx+w*0.22} ${rb} L ${cx-w*0.02} ${ry+w*0.22} Z`} fill="#AA1111" opacity=".9"/>
      <ellipse cx={cx} cy={ry+w*0.04} rx={w*0.14} ry={w*0.08} fill="#CC2222" stroke="rgba(0,0,0,.12)" strokeWidth={w*0.01}/>
      <path d={scallop} fill={`url(#ab${no}-f)`}/>
      <circle cx={cx} cy={cy} r={R} fill={`url(#ab${no}-f)`}/>
      {[0.88,0.72,0.54,0.34].map((f,i) => <circle key={i} cx={cx} cy={cy} r={R*f} fill="none" stroke={i%2===0?'rgba(255,255,255,.22)':'rgba(0,0,0,.1)'} strokeWidth={w*0.012}/>)}
      <ellipse cx={cx-R*0.22} cy={cy-R*0.28} rx={R*0.45} ry={R*0.22} fill="rgba(255,255,255,.38)"/>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={w*0.018}/>
      <text x={cx} y={cy+w*0.14} textAnchor="middle" fontSize={no>=10?w*0.28:w*0.38} fontWeight="900" fill="#7A4A00" fontFamily="'Vidaloka',serif">{no}</text>
    </svg>
  )

}

// ── Score detail modal ───────────────────────────────────────────────────────
function ScoreModal({ row, onClose }: {
  row: RankRow; onClose: () => void
}) {
  const isReward   = Number(row.total_score) >= 100


  const statCard = (label: string, value: React.ReactNode, color: string, sub?: string) => (
    <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 12, background: '#F8F9FC', border: `1px solid ${color}20`, textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.5px', color: '#838380', fontFamily: 'var(--font-lao)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: "'Vidaloka',serif", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#C0C8D8', marginTop: 3 }}>{sub}</div>}
    </div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,50,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, maxWidth: 520, width: '100%', boxShadow: '0 24px 60px rgba(10,20,50,.25)', overflow: 'hidden', animation: 'fadeUp .25s ease both', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#b71113,#8a0c0d)', padding: '20px 22px 16px', position: 'relative', borderBottom: '3px solid #D4A017' }}>
          <div style={{ position:'absolute', right:-40, top:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position:'relative', zIndex:1 }}>
            <EmpPhoto fingerCode={row.finger_code} name={row.fullname} size={56} border="2px solid #fff" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{row.fullname}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontFamily: 'Vidaloka', marginTop: 2 }}>{row.user_id}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
                {row.position   && <span style={{ padding: '3px 9px', borderRadius: 7, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontWeight: 600 }}>📋 {row.position}</span>}
                {row.level      && <span style={{ padding: '3px 9px', borderRadius: 7, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontWeight: 600 }}>⭐ {row.level}</span>}
                {row.sector     && <span style={{ padding: '3px 9px', borderRadius: 7, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontWeight: 600 }}>🗂️ {fmtUnit(row.sector)}</span>}
                {row.department && <span style={{ padding: '3px 9px', borderRadius: 7, background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontWeight: 600 }}>🏢 {fmtUnit(row.department)}</span>}
              </div>
            </div>
            {isReward && (
              <div style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:10, background:'linear-gradient(135deg,rgba(255,215,0,.3),rgba(255,140,0,.25))', border:'1.5px solid rgba(245,197,24,.5)', fontSize: 12, fontWeight:900, color:'#FFE066' }}>
                {Ico.award(11)} ພະນັກງານດີເດັ່ນ
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ position:'absolute', top:14, right:14, zIndex:2, background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.25)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '16px 20px 20px' }}>

          {/* ── Reference stats row ── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.5px', color: '#838380', marginBottom: 8, fontFamily: 'var(--font-lao)' }}>ຂໍ້ມູນທຸລະກໍາ</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {statCard('ລວມທຸລະກໍາ',    fmt(Number(row.txn_score)),      '#6366F1')}
              {statCard('ສະເລ່ຍທຸລະກໍາ/ມື້',  fmt(Number(row.txn_count)),      '#0EA5E9', `${row.day_of_work} ມື້`)}
            </div>
          </div>

          {/* ── Score components — 2-column paired layout ── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.5px', color: '#838380', marginBottom: 8, fontFamily: 'var(--font-lao)' }}>ສ່ວນປະກອບຄະແນນ</div>

            {/* Row 1: ທຸລະກໍາ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              {([
                { label: 'ຄະແນນທຸລະກໍາ',       value: row.weight_txn,          color: '#F59E0B', bg: '#F8F9FC' },
                { label: 'ຄະແນນເກີນຄ່າສະເລ່ຍ', value: row.txn_over_avg_score, color: '#06B6D4', bg: '#F0FBFF' },
              ] as const).map(s => (
                <div key={s.label} style={{ padding: '10px 12px', borderRadius: 11, background: s.bg, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 26, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#838380', fontWeight: 700, letterSpacing: '.3px', fontFamily: 'var(--font-lao)', lineHeight: 1.3 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'Vidaloka',serif", lineHeight: 1.3 }}>{fmt(s.value)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: Rev+Cor merged left, two bonus cards right */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 8, marginBottom: 8 }}>
              <div style={{ gridRow: 'span 2', padding: '10px 12px', borderRadius: 11, background: '#FFF1F2', border: '1px solid #b7111322', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, borderRadius: 2, background: '#b71113', flexShrink: 0, alignSelf: 'stretch' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#838380', fontWeight: 700, letterSpacing: '.3px', fontFamily: 'var(--font-lao)', lineHeight: 1.3 }}>ຄະແນນຜິດພາດ Rev + Cor</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#b71113', fontFamily: "'Vidaloka',serif", lineHeight: 1.3 }}>{fmt(Number(row.reverse_score) + Number(row.recor_score))}</div>
                </div>
              </div>
              {([
                { label: 'ຄະແນນບໍ່ມີ Reverse', value: row.rev_bonus,    color: '#F97316', bg: '#FFFBF5' },
                { label: 'ຄະແນນບໍ່ມີ Cor',     value: row.recor_bonus, color: '#EC4899', bg: '#FFF5FB' },
              ] as const).map(s => (
                <div key={s.label} style={{ padding: '10px 12px', borderRadius: 11, background: s.bg, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 26, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#838380', fontWeight: 700, letterSpacing: '.3px', fontFamily: 'var(--font-lao)', lineHeight: 1.3 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'Vidaloka',serif", lineHeight: 1.3 }}>{fmt(s.value)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 3: ວິໄນ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              {([
                { label: 'ຄະແນນວິໄນ',                  value: row.discipline_score, color: '#10B981', bg: '#F8F9FC' },
                { label: 'ຄະແນນບໍ່ມາການຊ້າ ຫຼື ກັບໄວ', value: row.attendent_score, color: '#14B8A6', bg: '#F0FFFE' },
              ] as const).map(s => (
                <div key={s.label} style={{ padding: '10px 12px', borderRadius: 11, background: s.bg, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 26, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#838380', fontWeight: 700, letterSpacing: '.3px', fontFamily: 'var(--font-lao)', lineHeight: 1.3 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "'Vidaloka',serif", lineHeight: 1.3 }}>{fmt(s.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Total ── */}
          <div style={{ padding: '14px 20px', borderRadius: 14, background: isReward ? 'linear-gradient(135deg,#FFF8E0,#FFF0B0)' : 'linear-gradient(135deg,#b71113,#8a0c0d)', border: `2px solid ${isReward ? '#E8C040' : '#8a0c0d'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isReward ? '#A07000' : '#fff' }}>ຄະແນນລວມ</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: isReward ? '#B07800' : '#FFE066', fontFamily: "'Vidaloka',serif", letterSpacing: '-1px' }}>{fmt(row.total_score)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function useCountUp(target: number, dec = 0, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const t = setTimeout(() => {
      let start = 0
      const step = target / 50
      const iv = setInterval(() => {
        start += step
        if (start >= target) { setVal(target); clearInterval(iv) }
        else setVal(start)
      }, 16)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return dec > 0 ? val.toFixed(dec) : Math.floor(val).toLocaleString()
}

const M_COLOR  = ['#D4A017', '#7A8FA6', '#b71113']
const M_RING   = ['#E8C040', '#A8BAD0', '#b71113']


const PAGE_SIZE = 10

// Each tab is a separate independent view
type ActiveView = 'rank_1' | 'rank_2' | 'rank_3' | 'by_dept'

const VIEW_RANK_ID: Record<ActiveView, number | null> = {
  rank_1: 1, rank_2: 2, rank_3: 3, by_dept: 1,  // by_dept always uses rankId=1 (all depts)
}

export default function PublicRankTellerPage() {
  const [rows, setRows]         = useState<RankRow[]>([])
  const [ranks, setRanks]       = useState<RankItem[]>([])
  const [departments, setDepts] = useState<DeptItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [animated, setAnimated] = useState(false)
  const [page, setPage]         = useState(1)

  const tilt1 = useRef<HTMLDivElement>(null)
  const tilt2 = useRef<HTMLDivElement>(null)
  const tilt3 = useRef<HTMLDivElement>(null)
  useTilt(tilt1); useTilt(tilt2); useTilt(tilt3)
  // Single source of truth — each tab fully independent
  const [activeView, setActiveView] = useState<ActiveView>('rank_1')
  const [deptId, setDeptId]             = useState<number | null>(null)
  const [byDeptRankId, setByDeptRankId] = useState<number | null>(null)
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const byDeptInitRef               = useRef(false)
  const [modalRow, setModalRow]         = useState<RankRow | null>(null)
  const [showFormula, setShowFormula]   = useState(false)
  const [zoomData, setZoomData]         = useState<{ src: string; row: RankRow } | null>(null)
  const [approvedPeriod, setApprovedPeriod] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [issueDates, setIssueDates]         = useState<string[]>([])
  const [notAnnounced, setNotAnnounced] = useState(false)
  const [announcements, setAnnouncements] = useState<{ id: number; title_lo: string; title_en: string | null; tag: string }[]>([])

  // Dynamic effects — all state declared above, safe to use here
  useScrollReveal([rows.length, activeView, animated])

  // Debounce search input by 350ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const isRankView = activeView !== 'by_dept'
  const rankId     = VIEW_RANK_ID[activeView]   // derived — no separate rankId state

  useEffect(() => {
    setLoading(true); setAnimated(false)
    const qs = new URLSearchParams()
    // by_dept view uses byDeptRankId (master_rank id > 3); rank views use derived rankId
    if (!isRankView && byDeptRankId !== null) qs.set('rankId', String(byDeptRankId))
    else qs.set('rankId', String(rankId))
    if (debouncedSearch) qs.set('search', debouncedSearch)
    if (selectedPeriod !== null) qs.set('issueDate', String(selectedPeriod))
    fetch(`/api/public/rank-teller?${qs}`)
      .then(r => r.json())
      .then(d => {
        setRows(d.rows ?? [])
        // console.log(d.rows )
        if (Array.isArray(d.ranks) && d.ranks.length) setRanks(d.ranks)
        if (d.approved_period !== undefined) setApprovedPeriod(d.approved_period)
        // Always update issueDates from every response
        if (Array.isArray(d.issue_dates)) setIssueDates(d.issue_dates)
        // Default to approved period only on the very first load
        if (selectedPeriod === null && d.approved_period) setSelectedPeriod(d.approved_period)
        setNotAnnounced(d.not_announced === true)
        // Fetch live announcements in parallel
        fetch('/api/public/announcements').then(r => r.json()).then(a => {
          if (Array.isArray(a.data)) setAnnouncements(a.data)
        }).catch(() => {})
        const depts: DeptItem[] = d.departments ?? []
        setDepts(depts)
        // Set default byDeptRankId to first rank with id > 3
        if (!isRankView && !byDeptInitRef.current) {
          const extRanks = (d.ranks ?? []).filter((r: RankItem) => r.id > 3)
          if (extRanks.length > 0 && byDeptRankId === null) {
            byDeptInitRef.current = true
            setByDeptRankId(extRanks[0].id)
          }
        }
        setTimeout(() => setAnimated(true), 80)
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, byDeptRankId, debouncedSearch, selectedPeriod])

  useEffect(() => { setPage(1) }, [activeView, byDeptRankId, debouncedSearch, selectedPeriod])
  useEffect(() => { setSearch(''); setDebouncedSearch('') }, [activeView])

  const top3      = rows.filter(r => Number(r.total_score) >= 100).slice(0, 5)
  const maxScore  = rows.length ? Math.max(...rows.map(r => Number(r.total_score))) : 0
  const avgScore  = rows.length ? rows.reduce((a, r) => a + Number(r.total_score), 0) / rows.length : 0
  const avgTxn_day  = rows.length ? rows.reduce((a, r) => a + Number(r.txn_count), 0) / rows.length : 0
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows  = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const mainRanks  = ranks.filter(r => r.id <= 3)
  const activeRank = ranks.find(r => r.id === (isRankView ? rankId : (byDeptRankId ?? rankId)))
  const activeDept = departments.find(d => d.id === deptId)

  // Translate rank group names to Lao (keys = actual Excel sheet names)
  const rankNameLao: Record<string, string> = {
    'Rank_Teller':   'ຈັດອັນດັບລວມ ທຄຕລ ທົ່ວລະບົບ',
    'Rank_HV':       'ຈັດອັນດັບລວມ ພາຍໃນນະຄອນຫຼວງວຽງຈັນ',
    'Rank_18 Oth':   'ຈັດອັນດັບລວມ ສາຂາຕ່າງແຂວງ',
    'Rank_010':      'ສຳນັກງານໃຫ່ຍ',
    'Rank_019':      'ສາຂາໂພນໂຮງ',
    'Rank_020':      'ສາຂາຄຳມ່ວນ',
    'Rank_030':      'ສາຂາສະຫວັນນະເຂດ',
    'Rank_040':      'ສາຂາຈຳປາສັກ',
    'Rank_050':      'ສາຂາຫຼວງພະບາງ',
    'Rank_060':      'ສາຂາອຸດົມໄຊ',
    'Rank_070':      'ສາຂາຫຼວງນໍ້າທາ',
    'Rank_080':      'ສາຂາອັດຕະປື',
    'Rank_090':      'ສາຂານະຄອນຫຼວງວຽງຈັນ',
    'Rank_110':      'ສາຂາບໍ່ແກ້ວ',
    'Rank_120':      'ສາຂາໄຊຍະບູລີ',
    'Rank_130':      'ສາຂາຊຽງຂວາງ',
    'Rank_140':      'ສາຂາວັງວຽງ',
    'Rank_150':      'ສາຂາບໍລິຄຳໄຊ',
    'Rank_160':      'ສາຂາດົງໂດກ',
    'Rank_170':      'ສາຂາຫົວພັນ',
    'Rank_180':      'ສາຂາຜົ້ງສາລີ',
    'Rank_190':      'ສາຂາເຊກອງ',
    'Rank_200':      'ສາຂາສາລະວັນ',
    'Rank_210':      'ສາຂາໄຊສົມບູນ',
    'Rank_220':      'ສາຂາໄຊເສດຖາ'
  }
  const rankIdLao: Record<number, string> = {
    1: 'ຈັດອັນດັບລວມ ທຄຕລ ທົ່ວລະບົບ',
    2: 'ຈັດອັນດັບລວມ ພາຍໃນນະຄອນຫຼວງວຽງຈັນ',
    3: 'ຈັດອັນດັບລວມ ສາຂາຕ່າງແຂວງ',
  }
  const rankLabel = (name: string, deptName?: string | null, id?: number) =>
    (id !== undefined && id <= 3 ? rankIdLao[id] : undefined) ?? rankNameLao[name] ?? (deptName ? fmtUnit(deptName) : name)

  const activeLabel = activeDept?.department ?? (activeRank ? rankLabel(activeRank.group_name, activeRank.dept_name, activeRank.id) : '')

  const handleRankClick = (view: ActiveView) => {
    setActiveView(view)
    // Do NOT touch deptId or byDeptInitRef — by_dept view is independent
  }

  const minScore  = rows.length ? Math.min(...rows.map(r => Number(r.total_score))) : 0
  // console.log(rows)
  // AVG(total_score / day_of_work) per teller
  const validRows   = rows.filter(r => (Number(r.day_of_work) || 0) > 0)
  const scorePerDay = avgTxn_day
  
    // console.log(validRows)
  const cMax      = useCountUp(maxScore,      2,   150)
  const cMin      = useCountUp(minScore,      2,   200)
  const cAvg      = useCountUp(avgScore,      2,   250)
  const cPerDay   = useCountUp(scorePerDay,   2,   300)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6FC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#b71113', marginBottom: 16, animation: 'spin 2s linear infinite', display: 'inline-block' }}>{Ico.medal(56)}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#6878A0', fontFamily: 'Noto Sans Lao, sans-serif' }}>ກຳລັງໂຫຼດ...</div>
      </div>
    </div>
  )

  // ── Not announced yet ────────────────────────────────────────────────────────
  if (notAnnounced) return (
    <div style={{ minHeight: '100vh', background: '#F4F6FC', fontFamily: "'Noto Sans Lao','Vidaloka',serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ animation: 'float 3s ease-in-out infinite', color: '#b71113' }}>{Ico.trophy(80)}</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1A2340', marginBottom: 10 }}>BCEL ລາງວັນ Teller ດີເດັ່ນ 2026</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#6878A0', marginBottom: 6, fontFamily: 'Noto Sans Lao, sans-serif' }}>
          ⏳ ຍັງບໍ່ໄດ້ປະກາດຜົນ
        </div>
        <div style={{ fontSize: 13, color: '#A0B0C8', fontFamily: 'Noto Sans Lao, sans-serif' }}>
          ຜົນການຈັດອັນດັບ Teller ດີເດັ່ນ ຈະຖືກປະກາດໃນໄວໆນີ້
        </div>
      </div>
      <div style={{ padding: '10px 24px', borderRadius: 20, background: 'rgba(200,0,30,.08)', border: '1px solid rgba(200,0,30,.2)', fontSize: 13, fontWeight: 700, color: '#b71113' }}>
        ທະນາຄານພາຍນອກລາວ (ມະຫາຊົນ)
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
    </div>
  )

  return (
    <>
    {modalRow && <ScoreModal row={modalRow} onClose={() => setModalRow(null)} />}
<div className="pub-page" style={{ overflowX: 'hidden' }}>
      {/* All styles in public-page.css */}

      {/* Confetti */}
      {animated && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="confetti-piece" style={{ left: `${(i * 3.33) % 100}%`, width: `${6 + (i % 4) * 2}px`, height: `${10 + (i % 4) * 4}px`, background: ['#b71113','#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#FF8C00'][i % 8], animationDuration: `${2.5 + (i % 6) * 0.5}s`, animationDelay: `${(i % 8) * 0.25}s`, opacity: 0 }} />
          ))}
        </div>
      )}

      {/* Red stripe */}
      <div className="sr" />

      {/* ── Main nav — BCEL style ── */}
      <nav>
        <div className="brand">
          <div className="brand-logo">B</div>
          <div className="brand-text">
            <div className="brand-name">BCEL Best Teller</div>
            <div className="brand-sub">Award 2026 · ລາງວັນດີເດັ່ນ</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Period selector */}
          {issueDates.length > 0 && (
            <select
              value={selectedPeriod ?? ''}
              onChange={e => setSelectedPeriod(e.target.value || null)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${selectedPeriod === approvedPeriod ? 'rgba(10,122,80,.3)' : 'rgba(183,17,19,.3)'}`,
                background: selectedPeriod === approvedPeriod ? 'rgba(10,122,80,.07)' : 'rgba(183,17,19,.06)',
                color: selectedPeriod === approvedPeriod ? '#0A7A50' : '#b71113',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {issueDates.map(d => {
                const isApproved = d === approvedPeriod
                return <option key={d} value={d}>📅 {d}{isApproved ? ' ✓' : ''}</option>
              })}
            </select>
          )}
          <div className="nav-live">
            <span className="dot" /> ການຈັດອັນດັບກຳລັງປະກາດ
          </div>
        </div>
      </nav>

      {/* Gold-blue BCEL signature stripe */}
      <div className="st" />

      {/* ── Ticker — announcements + top tellers ── */}
      {(() => {
        const duration = Math.max(20, (announcements.length + rows.filter(r => Number(r.total_score) >= 100).length) * 5) + 's'
        return (
          <div className="ticker-wrap">
            <div className="ticker-inner" style={{ animationDuration: duration }}>
              {[0, 1].map(copy => (
                <span key={copy} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {(announcements.length > 0
                    ? announcements
                    : [{ id: 0, title_lo: 'ຂໍສະແດງຄວາມຍິນດີ · ພະນັກງານບໍລິການດ້ານໜ້າດີເດັ່ນ 2026', title_en: null, tag: 'new' }]
                  ).map((a, ai) => (
                    <span key={`a${ai}`}>📣 {a.title_lo} &nbsp;·&nbsp; </span>
                  ))}
                  {rows.filter(r => Number(r.total_score) >= 100).map((r, ri) => (
                    <span key={`t${ri}`}>
                      <span style={{ fontSize: 18 }}>{['🥇','🥈','🥉'][ri]}</span>{' '}
                      {r.fullname} · {fmt(r.total_score)} ຄະແນນ. &nbsp;·&nbsp;{' '}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── HERO — Red impact zone ── */}
      <section className="hero-section" aria-label="Hero">
        {/* Floating particles — 8 only for performance */}
        {[
          { s:5, l:10, b:15, d:0,   dur:4.5, c:'rgba(255,255,255,.18)' },
          { s:7, l:25, b:30, d:1.2, dur:5.5, c:'rgba(245,197,24,.28)'  },
          { s:4, l:42, b:20, d:0.5, dur:4,   c:'rgba(255,255,255,.12)' },
          { s:6, l:58, b:40, d:1.8, dur:5,   c:'rgba(245,197,24,.22)'  },
          { s:5, l:70, b:12, d:0.8, dur:4.5, c:'rgba(255,255,255,.15)' },
          { s:8, l:82, b:35, d:2.2, dur:6,   c:'rgba(245,197,24,.2)'   },
          { s:4, l:90, b:55, d:0.3, dur:4,   c:'rgba(255,255,255,.1)'  },
          { s:6, l:18, b:60, d:1.5, dur:5,   c:'rgba(255,255,255,.12)' },
        ].map((p, i) => (
          <div key={i} className="hero-particle" style={{ width: p.s, height: p.s, left: `${p.l}%`, bottom: `${p.b}%`, background: p.c, animationDuration: `${p.dur}s`, animationDelay: `${p.d}s` }} />
        ))}
        <div className="hero-in">

          {/* ── Left: text ── */}
          <div style={{ animation: 'fadeUp .5s ease both' }}>

            {/* Eyebrow */}
            <div className="hero-eyebrow" style={{ marginBottom: 16 }}>
              <span style={{ color:'#F5C518', display:'flex' }}>{Ico.sparkle(12)}</span>
              ✨ ຜົນສະແດງພະນັກງານບໍລິການດ້ານໜ້າດີເດັ່ນ - ປະຈໍາປີ 2026 ✨
              <span style={{ color:'#F5C518', display:'flex' }}>{Ico.star(12)}</span>
            </div>

            {/* Title */}
            <h3 className="hero-title" style={{ marginBottom: 2 }}>
              ຈັດອັນດັບ<span className="latin"> Best Teller Award</span>
            </h3>
            <h2 className="hero-title" style={{ marginBottom: 28 }}>
              <span className="grad-gold">ປະຈໍາປີ </span><span className="grad-gold latin">2026</span>
            </h2>

            {/* Stat cards — 1 / 2 / 3 column layout */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'stretch' }}>
              {/* Col 1 */}
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(235,20,20,.45)', border: '1.5px solid rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 6px rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 120, height: 51 }}>
                <span style={{ display: 'flex', flexShrink: 0, background: 'rgba(255,255,255,.9)', borderRadius: 6, padding: 4, color: '#b71113' }}>{Ico.users(14)}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-lao)' }}>{rows.length} ຄົນ</span>
              </div>
              {/* Col 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([
                  { icon: Ico.building(14), text: `${!isRankView && activeDept ? 1 : (activeRank?.dept_count ?? '—')} ພາກສ່ວນ` },
                  { icon: Ico.sparkle(14),  text: `ທຸລະກໍາ / ມື້ ສະເລ່ຍ ${cPerDay}` },
                ] as const).map((c, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(235,20,20,.45)', border: '1.5px solid rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 6px rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 120, height: 51 }}>
                    <span style={{ display: 'flex', flexShrink: 0, background: 'rgba(255,255,255,.9)', borderRadius: 6, padding: 4, color: '#b71113' }}>{c.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-lao)' }}>{c.text}</span>
                  </div>
                ))}
              </div>
              {/* Col 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {([
                  { icon: Ico.chart(14),  text: `ຄະແນນ/ຄົນ ສະເລ່ຍ ${cAvg}` },
                  { icon: Ico.trophy(14), text: `ຄະແນນສູງສຸດ ${cMax}`      },
                  { icon: Ico.chart(14),  text: `ຄະແນນຕ່ຳສຸດ ${cMin}`       },
                ] as const).map((c, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(235,20,20,.45)', border: '1.5px solid rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 6px rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 120, height: 51 }}>
                    <span style={{ display: 'flex', flexShrink: 0, background: 'rgba(255,255,255,.9)', borderRadius: 6, padding: 4, color: '#b71113' }}>{c.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-lao)' }}>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Period badge */}
            {approvedPeriod && (
              <div style={{ display:'inline-flex', alignItems:'center', gap: 6, padding:'6px 14px', borderRadius:20, background:'rgba(245,197,24,.15)', border:'1.5px solid rgba(245,197,24,.35)', fontSize:12, fontWeight:700, color:'#F5C518' }}>
                📅 {approvedPeriod} · ໄລຍະເວລາ
              </div>
            )}
          </div>

          {/* ── Right: trophy ── */}
          <div className="hero-trophy-panel" style={{ animation: 'fadeUp .5s .12s ease both', display:'flex', flexDirection:'column', gap: 14, alignItems:'center' }} aria-hidden="true">
            <img src="/trophy.png" alt="Best Teller Trophy" style={{ width: 180, height: 180, objectFit: 'contain', display: 'block', animation: 'float 2.8s ease-in-out infinite', filter: 'drop-shadow(0 8px 28px rgba(0,0,0,.4))' }} />
            {rows[0] && Number(rows[0].total_score) >= 100 && (
              <div style={{
                borderRadius: 18, padding: '14px 20px', textAlign:'center', width:'100%',
                animation: 'fadeIn .6s .3s ease both',
                background: 'rgba(255,255,255,.14)', backdropFilter:'blur(16px)',
                border: '1.5px solid rgba(255,255,255,.25)',
                boxShadow: '0 8px 24px rgba(0,0,0,.2)',
              }}>
                <div style={{ fontSize: 12, fontWeight:800, letterSpacing:'1.5px', color:'#F5C518', marginBottom:6, display:'flex', alignItems:'center', justifyContent:'center', gap:5, textTransform:'uppercase' }}>
                  {Ico.no1(16,'#F5C518')} ອັນດັບ 1
                </div>
                <div style={{ fontSize:15, fontWeight:900, color:'#fff', lineHeight:1.3 }}>{rows[0].fullname}</div>
                <div style={{ fontSize:20, color:'#F5C518', fontWeight:900, marginTop:4, fontFamily:"'Vidaloka',serif", letterSpacing:'-0.5px' }}>{fmt(rows[0].total_score)}</div>
                <div style={{ fontSize: 12, color:'rgba(255,255,255,.5)', marginTop:2, letterSpacing:'1px' }}>ຄະແນນລວມ</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Category tabs ── */}
      <nav className="cat-bar" aria-label="Rank category navigation" role="navigation">
        {mainRanks.map(rk => {
          const view   = `rank_${rk.id}` as ActiveView
          const active = activeView === view
          return (
            <button key={rk.id} className={`cat-tab${active ? ' on' : ''}`}
              onClick={() => handleRankClick(view)} aria-pressed={active}>
              <span style={{ display:'flex', opacity: active ? 1 : .6 }}>{Ico.trophy(14)}</span>
              {rankLabel(rk.group_name, rk.dept_name, rk.id)}
              {/* <span className="cat-badge">{rk.dept_count}</span> */}
            </button>
          )
        })}
        <button
          className={`cat-tab${activeView === 'by_dept' ? ' on' : ''}`}
          aria-pressed={activeView === 'by_dept'}
          onClick={() => {
            if (activeView === 'by_dept') return
            byDeptInitRef.current = false
            setDeptId(null)
            setByDeptRankId(null)
            setActiveView('by_dept')
          }}>
          <span style={{ display:'flex', opacity: activeView === 'by_dept' ? 1 : .6 }}>{Ico.building(14)}</span>
          ຈັດອັນດັບ ແຍກເປັນແຕ່ລະພາກສ່ວນ
        </button>

      </nav>

      {/* ── Formula Modal ── */}
      {showFormula && (
        <div onClick={() => setShowFormula(false)} style={{ position:'fixed', inset:0, background:'rgba(10,20,50,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:24, maxWidth:560, width:'100%', boxShadow:'0 24px 60px rgba(10,20,50,.25)', overflow:'hidden', animation:'fadeUp .25s ease both', maxHeight:'90vh', overflowY:'auto' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#b71113,#8a0c0d)', padding:'20px 24px 18px', position:'relative', borderBottom:'3px solid #D4A017' }}>
              <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>ການກໍານົດເງື່ອນໄຂໃຫ້ຄະແນນ</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.65)', marginTop:4 }}>BCEL Best Teller Award 2026</div>
              <button onClick={() => setShowFormula(false)} style={{ position:'absolute', top:14, right:14, zIndex:2, background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.25)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ padding:'20px 24px 24px' }}>

              {/* Formula summary */}
              <div style={{ background:'linear-gradient(135deg,#FFF8E0,#FFF3CC)', border:'2px solid #F5C518', borderRadius:16, padding:'14px 18px', marginBottom:20, textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'1.5px', color:'#A07000', marginBottom:8, textTransform:'uppercase' }}>ຄະແນນລວມ (TOTAL SCORE)</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#7A5000', lineHeight:1.8, fontFamily:"'Noto Sans Lao',serif" }}>
                  = ຄະແນນລວມທຸລະກໍາ (70%) + ຄວາມຜິດທາງບັນຊີ (20%) + ການ<br/>
                    ປະຕິບັດໂມງເວລາປະຈໍາການ (10%) + ຄະແນນພິເສດ (15%)
                </div>
              </div>

              {/* Main components */}
              <div style={{ fontSize:13, fontWeight:800, color:'#838380', letterSpacing:'.5px', marginBottom:10, textTransform:'uppercase' }}>ການຖ່ວງນໍ້າໜັກ</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {[
                  { label:'ຄະແນນລວມທຸລະກໍາ', weight:'70%', color:'#F59E0B', bg:'#FFFBEB', desc:'ຄະແນນລວມຈໍານວນທຸລະກໍາ + ຂາຍຜະລິດຕະພັນ ຜ່ານເຄົາເຕີ ທັງໝົດ: ຖ່ວງນໍ້າໜັກ  70% ຫຼື ເທົ່າກັບຄະແນນສູງສຸດ 70 ຄະແນນ' },
                  { label:'ຄະແນນຄວາມຜິດທາງບັນຊີ', weight:'20%', color:'#b71113', bg:'#FFF1F2', desc:'ຄະແນນຄ່າສະເລ່ຍລາຍການ Reverse + Cor: ຖ່ວງນໍ້າໜັກ 20% ຫຼື ເທົ່າກັບຄະແນນສູງສຸດ 20 ຄະແນນ' },
                  { label:'ຄະແນນປະຕິບັດໂມງເວລາ', weight:'10%', color:'#10B981', bg:'#ECFDF5', desc:'ຄະແນນຈໍານວນຄັ້ງການປະຕິບັດໂມງເວລາປະຈໍາການ: ຖ່ວງນໍ້າໜັກ 10% ຫຼື ເທົ່າກັບຄະແນນສູງສຸດ 10 ຄະແນນ' },
                ].map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:c.bg, border:`1.5px solid ${c.color}22` }}>
                    <div style={{ flexShrink:0, minWidth:52, padding:'4px 8px', borderRadius:8, background:c.color, color:'#fff', fontSize:13, fontWeight:900, textAlign:'center' }}>{c.weight}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:'#0A1628' }}>{c.label}</div>
                      <div style={{ fontSize:11, color:'#838380', marginTop:2 }}>{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bonus components */}
              <div style={{ fontSize:13, fontWeight:800, color:'#838380', letterSpacing:'.5px', marginBottom:10, textTransform:'uppercase' }}>ຄະແນນພິເສດ</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {[
                  { label:'ຄະແນນລວມທຸລະກໍາເກີນຄ່າສະເລ່ຍ',         bonus:'5%', color:'#F97316', desc:'ຈໍານວນຄະແນນທຸລະກໍາເກີນຄ່າສະເລ່ຍ ຫຼື ຄ່າກາງ ນັບແຕ່ 200% ຂຶ້ນໄປແມ່ນຈະບວກເພີ່ມຄະແນນພິເສດໃຫ້ສູງສຸດ +5 ຄະແນນ' },
                  { label:'ຄະແນນບໍ່ມີລາຍການຄວາມຜິດທາງບັນຊີ',    bonus:'5%', color:'#F97316', desc:'ກໍລະນີພະນັກງານທີ່ບໍ່ມີລາຍການ Reverse + Cor = 0 ລາຍການ ຈະບວກເພີ່ມຄະແນນພິເສດສູງສຸດ +5 ຄະແນນ (Reverse +2.5 / Cor +2.5)' },
                  { label:'ຄະແນນບໍ່ມາການຊ້າ ຫຼື ກັບໄວ',           bonus:'5%', color:'#F97316', desc:'ກໍລະນີພະນັກງານປະຕິບັດຕາມໂມງເວລາປະຈໍາການໄດ້ (ບໍ່ມີການມາຊ້າ+ກັບໄວ) = 0 ຄັ້ງ ຈະບວກເພີ່ມຄະແນນພິເສດສູງສຸດ +5 ຄະແນນ' },
                ].map((b, i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:12, background:'#FFF8F2', border:'1.5px solid #F9731622' }}>
                    <div style={{ flexShrink:0, width:40, height:40, borderRadius:10, background:'#F97316', color:'#fff', fontSize:13, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{b.bonus}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:800, color:'#0A1628', marginBottom:3 }}>{b.label}</div>
                      <div style={{ fontSize:11, color:'#838380', lineHeight:1.5 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Award threshold */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:'linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,140,0,.1))', border:'1.5px solid rgba(212,160,23,.4)', marginBottom:20 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#A07000' }}>ເກນຄະແນນທີ່ຈະໄດ້ຮັບຄັດເລືອກເປັນ</div>
                  <div style={{ fontSize:12, color:'#7A5000', marginTop:2 }}>ພະນັກງານບໍລິການດ້ານໜ້າດີເດັ່ນ ຕ້ອງມີຄະແນນລວມທັງໝົດ<strong> ≥ 100</strong> ຄະແນນ ຂຶ້ນໄປ</div>
                </div>
              </div>

              {/* master_rank calculation groups */}
              <div style={{ fontSize:13, fontWeight:800, color:'#838380', letterSpacing:'.5px', marginBottom:10, textTransform:'uppercase' }}>ການແບ່ງກຸ່ມຈັດອັນດັບ Best Teller Award</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  { id:'1', label:'ຈັດອັນດັບລວມ ທຄຕລ ທົ່ວລະບົບ',          desc:'ລວມມີ ສູນບໍລິການ + ພະແນກການຕະຫຼາດ ແລະ ບໍລິການລູກຄ້າລາຍໃຫຍ່ + 21 ສາຂາ ທົ່ວລະບົບ',          color:'#b71113', bg:'#FFF1F2' },
                  { id:'2', label:'ຈັດອັນດັບລວມ ພາຍໃນນະຄອນຫຼວງວຽງຈັນ',        desc:'ລວມມີ ສູນບໍລິການ + ພະແນກການຕະຫຼາດ ແລະ ບໍລິການລູກຄ້າລາຍໃຫຍ່ + 3 ສາຂາ ໃນນະຄອນຫຼວງວຽງຈັນ',               color:'#2563EB', bg:'#EFF6FF' },
                  { id:'3', label:'ຈັດອັນດັບລວມ ສາຂາຕ່າງແຂວງ',        desc:'ລວມມີ 18 ສາຂາ ທີ່ຕັ້ງຢູ່ຕ່າງແຂວງ',              color:'#059669', bg:'#ECFDF5' },
                  { id:'4+', label:'ຈັດອັນດັບ ແຍກເປັນແຕ່ລະພາກສ່ວນ', desc:'ລວມມີ 1 ສໍານັກງານໃຫຍ່ (ສູນບໍລິການ + ພະແນກການຕະຫຼາດ ແລະ ບໍລິການລູກຄ້າລາຍໃຫຍ່) ແລະ 21 ສາຂາ ທຄຕລ ທົ່ວລະບົບ',  color:'#7C3AED', bg:'#F5F3FF' },
                ].map((g, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:12, background:g.bg, border:`1.5px solid ${g.color}22` }}>
                    <div style={{ flexShrink:0, minWidth:34, padding:'3px 6px', borderRadius:8, background:g.color, color:'#fff', fontSize:12, fontWeight:900, textAlign:'center', marginTop:1 }}>{g.id}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:'#0A1628' }}>{g.label}</div>
                      <div style={{ fontSize:11, color:'#838380', marginTop:2 }}>{g.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}


      <main role="main" aria-label="Teller ranking results" className="pub-main">

        {isRankView && <>
        {/* ── Podium ── */}
        {top3.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ width: 4, height: 22, background: 'var(--red)', borderRadius: 2 }} />
              <span style={{ fontSize: 20, fontWeight: 900, color: '#0A1628', fontFamily: 'var(--font-lao)' }}>5 ອັນດັບທໍາອິດ</span>
              {activeLabel && <span style={{ fontSize: 13, color: '#8A9BB8', fontWeight: 600 }}>{activeLabel}</span>}
              <button
                onClick={() => setShowFormula(true)}
                title="ສູດຄຳນວນຄະແນນ"
                style={{ marginLeft: 4, display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:16, border:'1.5px solid rgba(183,17,19,.22)', background:'rgba(183,17,19,.06)', color:'#b71113', fontSize:12, fontWeight:700, cursor:'pointer', transition:'.15s', flexShrink:0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(183,17,19,.14)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(183,17,19,.06)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                ລາຍລະອຽດ
              </button>
            </div>

            {/* Podium: 4th | 2nd | 1st | 3rd | 5th — all bottoms aligned */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {[top3[3], top3[1], top3[0], top3[2], top3[4]].map((r, col) => {
                if (!r) return <div key={col} style={{ flex: 1 }} />
                const origIdx  = top3.indexOf(r)
                const isFirst  = origIdx === 0
                const platH    = [300, 200, 160, 120, 90][origIdx]
                const numColor = ['rgba(255,215,0,.95)','rgba(255,255,255,.9)','rgba(255,255,255,.85)','rgba(255,255,255,.8)','rgba(255,255,255,.75)'][origIdx]
                const avatarSz = isFirst ? 80 : origIdx <= 2 ? 60 : 48
                const nameSz   = isFirst ? 20 : origIdx <= 2 ? 15 : 13
                const scoreSz  = isFirst ? 42 : origIdx <= 2 ? 26 : 20

                return (
                  <div key={r.user_id} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    animation: `fadeUp .5s ${col * .1}s ease both`,
                  }}>

                    {/* ── Floating content above platform (no card) ── */}
                    <div style={{ width: '100%', padding: '0 8px 12px', textAlign: 'center', animation: `fadeUp .4s ${col*.08}s ease both` }}>


                      {/* Profile photo — all red */}
                      <div style={{ position: 'relative', width: avatarSz, height: avatarSz, margin: '0 auto 10px' }}>
                        <EmpPhoto fingerCode={r.finger_code} name={r.fullname} size={avatarSz} border="3px solid #fff" shadow="0 2px 8px rgba(0,0,0,.15)" onZoom={(src) => setZoomData({ src, row: r })} />
                        <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '2px solid rgba(183,17,19,.25)', pointerEvents: 'none' }} />
                      </div>

                      {/* Name */}
                      <div style={{ fontSize: nameSz, fontWeight: 900, color: '#0A1628', fontFamily: 'var(--font-lao)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', marginBottom: 2 }}>{r.fullname}</div>
                      <div style={{ fontSize: 14, color: '#838380', fontFamily: 'Vidaloka', marginBottom: 10 }}>{r.user_id}</div>

                      {/* Score — all red */}
                      <div style={{ fontSize: scoreSz, fontWeight: 900, color: '#b71113', letterSpacing: '-.5px', lineHeight: 1, fontFamily: "'Vidaloka',serif" }}>{fmt(r.total_score)}</div>
                      <div style={{ fontSize: 14, color: '#838380', marginTop: 2, marginBottom: r.sector ? 8 : 0, fontFamily: 'var(--font-lao)' }}>ຄະແນນລວມ</div>

                      {/* Dept + Sector badges — all red */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginTop: 8 }}>
                        {r.sector && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(183,17,19,.05)', border: '1px solid rgba(183,17,19,.15)', fontSize: 13, fontWeight: 600, color: '#b71113', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-lao)' }}>
                            {Ico.building(12)} {fmtUnit(r.sector)}
                          </div>
                        )}
                        {r.department && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(183,17,19,.07)', border: '1px solid rgba(183,17,19,.2)', fontSize: 13, fontWeight: 700, color: '#b71113', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-lao)' }}>
                            {Ico.mappin(12)} {fmtUnit(r.department)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Platform block ── */}
                    <div style={{
                      width: '100%', height: platH,
                      background: 'linear-gradient(160deg,#AA1212 0%,#7A0A0A 45%,#560808 100%)',
                      borderRadius: '10px 10px 0 0',
                      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.09), inset 0 -2px 0 rgba(0,0,0,.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom,rgba(255,255,255,.07),transparent)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'rgba(255,255,255,.06)' }} />
                      <span style={{ fontSize: Math.min(platH * 0.42, 100), fontWeight: 900, color: numColor, fontFamily: "'Vidaloka',serif", lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>
                        {origIdx + 1}
                      </span>
                    </div>

                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>}

        {/* ════ BY-DEPARTMENT VIEW ════ */}
        {activeView === 'by_dept' && (() => {
          const DEPT_PAGE_SIZE = 10
          const rewardRows  = rows.filter(r => Number(r.total_score) >= 100)   // score ≥ 100 only
          const dTop3       = rewardRows.slice(0, 5)
          const deptPgCount = Math.max(1, Math.ceil(rows.length / DEPT_PAGE_SIZE))
          const deptPage    = Math.min(page, deptPgCount)
          const deptRows    = rows.slice((deptPage - 1) * DEPT_PAGE_SIZE, deptPage * DEPT_PAGE_SIZE)
          const deptLabel   = activeDept?.department ?? ''

          return (
            <div>
              {/* ── Rank group selector (master_rank id > 3) ── */}
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E8EBF5', padding: '14px 18px', marginBottom: 20, boxShadow: '0 2px 10px rgba(30,50,100,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: '#b71113', display: 'flex' }}>{Ico.trophy(16)}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1A2340' }}>ພາກສ່ວນ</span>
                  <span style={{ fontSize: 12, color: '#838380', fontWeight: 600 }}>{ranks.filter(r => r.id > 3).length}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {byDeptRankId !== null && (
                      <span style={{ padding: '3px 12px', borderRadius: 20, background: 'rgba(183,17,19,.06)', color: '#b71113', fontSize: 12, fontWeight: 700 }}>
                        {rankLabel(ranks.find(r => r.id === byDeptRankId)?.group_name ?? '', ranks.find(r => r.id === byDeptRankId)?.dept_name, byDeptRankId ?? undefined)} · {rows.length} ຄົນ
                      </span>
                    )}
                    {selectedPeriod && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 12px', borderRadius: 20, background: 'rgba(10,122,80,.07)', border: '1px solid rgba(10,122,80,.2)', fontSize: 12, fontWeight: 700, color: '#0A7A50' }}>
                        📅 {selectedPeriod}
                        {selectedPeriod === approvedPeriod && <span style={{ marginLeft: 2, opacity: .7 }}>✓</span>}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ranks.filter(r => r.id > 3).map(rk => {
                    const active = byDeptRankId === rk.id
                    return (
                      <button key={rk.id} onClick={() => { setByDeptRankId(rk.id); setPage(1) }} style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', border: '1.5px solid', whiteSpace: 'nowrap', transition: '.15s',
                        borderColor: active ? '#b71113' : '#E0E4F0',
                        background:  active ? 'linear-gradient(135deg,#b71113,#8a0c0d)' : '#fff',
                        color:       active ? '#fff' : '#6878A0',
                        boxShadow:   active ? '0 2px 8px rgba(200,0,30,.25)' : '0 1px 3px rgba(0,0,0,.05)',
                      }}>
                        {rankLabel(rk.group_name, rk.dept_name, rk.id)}
                        <span style={{ fontSize: 12, opacity: .75, marginLeft: 4 }}>({rk.dept_count})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Top 3 Reward Podium (score ≥ 100 only) ── */}
              {dTop3.length > 0 ? (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 16px', background: 'linear-gradient(135deg,rgba(255,215,0,.12),rgba(255,140,0,.08))', borderRadius: 14, border: '1px solid rgba(212,160,23,.25)' }}>
                    <span style={{ color: '#D4A017', display: 'flex', animation: 'glow 2.5s ease-in-out infinite' }}>{Ico.trophy(20)}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#1A2340' }}>ລາງວັນດີເດັ່ນ · {deptLabel}</div>
                      <div style={{ fontSize: 12, color: '#A07000', fontWeight: 600, marginTop: 1 }}>ຜູ້ທີ່ໄດ້ຮັບລາງວັນ (ຄະແນນ ≥ 100) · {rewardRows.length} ຄົນ</div>
                    </div>
                  </div>
                  {/* Same podium style as main rank view */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    {[dTop3[3], dTop3[1], dTop3[0], dTop3[2], dTop3[4]].map((r, col) => {
                      if (!r) return <div key={col} style={{ flex: 1 }} />
                      const origIdx  = dTop3.indexOf(r)
                      const isFirst  = origIdx === 0
                      const platH    = [300, 200, 160, 120, 90][origIdx]
                      const numColor = ['rgba(255,215,0,.95)','rgba(255,255,255,.9)','rgba(255,255,255,.85)','rgba(255,255,255,.8)','rgba(255,255,255,.75)'][origIdx]
                      const avatarSz = isFirst ? 72 : origIdx <= 2 ? 56 : 44
                      return (
                        <div key={r.user_id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `fadeUp .5s ${col*.1}s ease both` }}>

                          {/* Content above platform — same style as main rank */}
                          <div style={{ width: '100%', padding: '0 8px 12px', textAlign: 'center', animation: `fadeUp .4s ${col*.08}s ease both` }}>
                              {/* Profile photo */}
                            <div style={{ position:'relative', width:avatarSz, height:avatarSz, margin:'0 auto 10px' }}>
                              <EmpPhoto fingerCode={r.finger_code} name={r.fullname} size={avatarSz} border="3px solid #fff" shadow="0 2px 8px rgba(0,0,0,.15)" onZoom={(src) => setZoomData({ src, row: r })} />
                              <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:'2px solid rgba(183,17,19,.25)', pointerEvents:'none' }} />
                            </div>
                            {/* Name */}
                            <div style={{ fontSize:isFirst?20:17, fontWeight:900, color:'#0A1628', fontFamily:'var(--font-lao)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', marginBottom:2 }}>{r.fullname}</div>
                            <div style={{ fontSize:14, color:'#838380', fontFamily:"'Vidaloka',serif", marginBottom:10 }}>{r.user_id}</div>
                            {/* Score — red */}
                            <div style={{ fontSize:isFirst?42:29, fontWeight:900, color:'#b71113', letterSpacing:'-.5px', lineHeight:1, fontFamily:"'Vidaloka',serif" }}>{fmt(r.total_score)}</div>
                            <div style={{ fontSize:14, color:'#838380', marginTop:2, marginBottom:8, fontFamily:'var(--font-lao)' }}>ຄະແນນລວມ</div>
                            {/* Badges — red */}
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                              {r.sector && (
                                <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:20, background:'rgba(183,17,19,.05)', border:'1px solid rgba(183,17,19,.15)', fontSize:13, fontWeight:600, color:'#b71113', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-lao)' }}>
                                  {Ico.building(12)} {fmtUnit(r.sector)}
                                </div>
                              )}
                              {r.department && (
                                <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 12px', borderRadius:20, background:'rgba(183,17,19,.07)', border:'1px solid rgba(183,17,19,.2)', fontSize:13, fontWeight:700, color:'#b71113', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-lao)' }}>
                                  {Ico.mappin(12)} {fmtUnit(r.department)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Platform */}
                          <div style={{ width:'100%', height:platH, background:'linear-gradient(160deg,#AA1212 0%,#7A0A0A 45%,#560808 100%)', borderRadius:'10px 10px 0 0', boxShadow:'inset 0 2px 0 rgba(255,255,255,.09)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                            <div style={{ position:'absolute', top:0, left:0, right:0, height:'35%', background:'linear-gradient(to bottom,rgba(255,255,255,.07),transparent)', pointerEvents:'none' }} />
                            <span style={{ fontSize:Math.min(platH*.42,100), fontWeight:900, color:numColor, fontFamily:"'Vidaloka',serif", lineHeight:1, textShadow:'0 2px 10px rgba(0,0,0,.5)' }}>
                              {origIdx+1}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 24, padding: '20px', borderRadius: 16, background: '#F7F8FC', border: '1px solid #E8EBF5', textAlign: 'center', color: '#8A9BB8', fontSize: 13, fontWeight: 600 }}>
                  ຍັງບໍ່ມີຜູ້ທີ່ໄດ້ຮັບລາງວັນ (ຄະແນນ ≥ 100) ໃນສ່ວນນີ້
                </div>
              )}

              {/* ── Full ranking table ── */}
              <div style={{ marginBottom: 8, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ color:'#b71113', display:'flex' }}>{Ico.table(16)}</span>
                <span style={{ fontSize:14, fontWeight:800, color:'#1A2340' }}>ຄະແນນທັງໝົດ · {deptLabel}</span>
                <span style={{ fontSize:11, color:'#8A9BB8' }}>{rows.length} ຄົນ</span>
                <button
                  onClick={() => setShowFormula(true)}
                  title="ສູດຄຳນວນຄະແນນ"
                  style={{ marginLeft: 4, display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:16, border:'1.5px solid rgba(183,17,19,.22)', background:'rgba(183,17,19,.06)', color:'#b71113', fontSize:12, fontWeight:700, cursor:'pointer', transition:'.15s', flexShrink:0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(183,17,19,.14)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(183,17,19,.06)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  ລາຍລະອຽດ
                </button>
              </div>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EBF5', overflow: 'hidden', boxShadow: '0 2px 16px rgba(30,50,100,.07)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg,#F7F9FF,#F2F4FC)', borderBottom: '2px solid #EAEDF8' }}>
                        {[
                          { h: '#',              align: 'center' },
                          { h: 'ຊື່',            align: 'left'   },
                          { h: 'ຂະແໜງ / ໜ່ວຍ',  align: 'left'   },
                          { h: 'ສາຂາ / ພະແນກ',  align: 'left'   },
                          { h: 'ລວມ',            align: 'right'  },
                          { h: '',               align: 'center' },
                        ].map((c, i) => (
                          <th key={i} style={{ padding: '12px 12px', textAlign: c.align as React.CSSProperties['textAlign'], fontSize: 12, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgb(255, 255, 255)', whiteSpace: 'nowrap', background: '#b71113', borderBottom: '3px solid #8a0c0d' }}>{c.h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deptRows.map((r, i) => {
                        const globalIdx  = (deptPage - 1) * DEPT_PAGE_SIZE + i
                        const isReward   = Number(r.total_score) >= 100
                        const isTop3     = globalIdx < 3 && isReward
                        const isTop5     = globalIdx < 5 && isReward
                        const MedalSvg   = isTop3 ? MEDAL_SVGS[Math.min(globalIdx, 2)] : null
                        const scoreColor = isTop3 ? M_COLOR[Math.min(globalIdx,2)] : isReward ? '#B07800' : '#b71113'
                        const maxSc      = rows.length ? Math.max(...rows.map(x => Number(x.total_score))) : 1
                        const pct        = maxSc > 0 ? (Number(r.total_score) / maxSc * 100) : 0
                        const barGrad    = isTop3 ? `linear-gradient(90deg,${M_RING[Math.min(globalIdx,2)]},${M_COLOR[Math.min(globalIdx,2)]})` : isReward ? 'linear-gradient(90deg,#D4A017,#FFB800)' : 'linear-gradient(90deg,#b71113,#d93032)'
                        return (
                          <tr key={r.user_id} style={{
                            borderBottom: '1px solid #F5F7FA',
                            background: isTop3 ? `${M_RING[Math.min(globalIdx,2)]}0D` : isReward ? 'rgba(212,160,23,.03)' : undefined,
                            transition: 'background .12s', cursor: 'pointer',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(183,17,19,.035)')}
                            onMouseLeave={e => (e.currentTarget.style.background = isTop3 ? `${M_RING[Math.min(globalIdx,2)]}0D` : isReward ? 'rgba(212,160,23,.03)' : '')}
                          >
                            {/* Rank */}
                            <td style={{ padding: '12px 12px', textAlign: 'center', width: 52 }}>
                              {isTop3 && MedalSvg
                                ? <div style={{ display:'flex', justifyContent:'center' }}>{MedalSvg(34)}</div>
                                : isTop5
                                  ? <div style={{ display:'flex', justifyContent:'center' }}><AwardBadge no={globalIdx+1} size={34} /></div>
                                  : <div style={{ width:32, height:32, borderRadius:10, background:'#F2F4FA', border:'1.5px solid #E8EBF5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#838380', margin:'0 auto' }}>{globalIdx+1}</div>
                              }
                            </td>
                            {/* Name + avatar */}
                            <td style={{ padding: '12px 12px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <EmpPhoto fingerCode={r.finger_code} name={r.fullname} size={38} border="2px solid #fff" shadow="0 1px 4px rgba(0,0,0,.12)" onZoom={(src) => setZoomData({ src, row: r })} />
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontWeight:700, color:'#0A1628', fontSize:13, lineHeight:1.3 }}>{r.fullname}</div>
                                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                                    <span style={{ fontSize: 12, color:'#838380', fontFamily:'Vidaloka' }}>{r.user_id}</span>
                                    {r.position && <span style={{ fontSize: 12, padding:'1px 5px', borderRadius:4, background:'#EEF1F6', color:'#7A8BAA', fontWeight:600 }}>{r.position}</span>}
                                    {isReward && (
                                      <span style={{ display:'inline-flex', alignItems:'center', gap:2, padding:'1px 6px', borderRadius:7, background:'linear-gradient(135deg,rgba(255,215,0,.2),rgba(255,140,0,.12))', border:'1px solid rgba(212,160,23,.35)', fontSize: 12, fontWeight:900, color:'#A07000', whiteSpace:'nowrap' }}>
                                        {Ico.award(9)} 100+
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Sector */}
                            <td style={{ padding: '12px 12px' }}>
                              {r.sector
                                ? <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'3px 9px', borderRadius:7, background:'#F0F4FF', color:'#4A6AC8', fontSize:11, fontWeight:600 }}>
                                    {Ico.building(10)} {fmtUnit(r.sector)}
                                  </span>
                                : <span style={{ color:'#C8D0E0', fontSize:12 }}>—</span>
                              }
                            </td>
                            {/* Department */}
                            <td style={{ padding: '12px 12px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                <span style={{ color:'#b71113', opacity:.45, flexShrink:0, display:'flex' }}>{Ico.mappin(11)}</span>
                                <span style={{ fontSize:12, color:'#3A5070', fontWeight:500 }}>{fmtUnit(r.department) || '—'}</span>
                              </div>
                            </td>
                            {/* Score + bar */}
                            <td style={{ padding: '12px 16px 12px 12px', minWidth:120 }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                                <div style={{ fontFamily:"'Vidaloka',serif", fontWeight:900, fontSize:15, color:scoreColor, letterSpacing:'-.3px' }}>{fmt(r.total_score)}</div>
                                <div style={{ width:80, height:4, borderRadius:99, background:'#EEF1F6', overflow:'hidden' }}>
                                  <div style={{ height:'100%', borderRadius:99, background:barGrad, width:`${pct}%`, transition:'width .8s cubic-bezier(.4,0,.2,1)' }} />
                                </div>
                              </div>
                            </td>
                            {/* Detail */}
                            <td style={{ padding:'12px 12px', textAlign:'center', width:80 }}>
                              <button onClick={() => setModalRow(r)}
                                style={{ padding:'5px 12px', borderRadius:9, border:'1.5px solid #E2E8F0', background:'#F7F9FF', color:'#4A5578', fontSize:11, fontWeight:700, cursor:'pointer', transition:'.15s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#b71113'; (e.currentTarget as HTMLButtonElement).style.color='#b71113' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.color='#4A5578' }}
                              >
                                ລາຍລະອຽດ
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {deptPgCount > 1 && (
                  <div style={{ padding: '18px 24px', borderTop: '1px solid #F0F2FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, color: '#8A9BB8', fontWeight: 600 }}>ໜ້າ {deptPage} / {deptPgCount} · {rows.length} ຄົນ</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[
                        { icon: Ico.chevLL(), action: () => setPage(1),                         disabled: deptPage === 1 },
                        { icon: Ico.chevL(),  action: () => setPage(p => Math.max(1, p-1)),     disabled: deptPage === 1 },
                        { icon: Ico.chevR(),  action: () => setPage(p => Math.min(deptPgCount, p+1)), disabled: deptPage === deptPgCount },
                        { icon: Ico.chevRR(), action: () => setPage(deptPgCount),               disabled: deptPage === deptPgCount },
                      ].map((btn, bi) => (
                        <button key={bi} className="pg-btn" onClick={btn.action} disabled={btn.disabled} style={{ width:36, height:36, borderRadius:10, border:'1.5px solid', borderColor: btn.disabled?'#EAEDF5':'#E0E4F0', background: btn.disabled?'#F7F8FC':'#fff', color: btn.disabled?'#C8D0E0':'#3A4A6A', cursor: btn.disabled?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: btn.disabled?'none':'0 1px 4px rgba(0,0,0,.07)', transition:'all .15s' }}>{btn.icon}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Array.from({ length: Math.min(deptPgCount, 7) }, (_, i) => {
                        const p = deptPgCount <= 7 ? i+1 : deptPage <= 4 ? i+1 : deptPage >= deptPgCount-3 ? deptPgCount-6+i : deptPage-3+i
                        return (
                          <button key={p} onClick={() => setPage(p)} style={{ width:36, height:36, borderRadius:10, border:'1.5px solid', borderColor: deptPage===p?'#b71113':'#E0E4F0', background: deptPage===p?'linear-gradient(135deg,#b71113,#8a0c0d)':'#fff', color: deptPage===p?'#fff':'#6878A0', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow: deptPage===p?'0 4px 12px rgba(200,0,30,.3)':'0 1px 4px rgba(0,0,0,.07)', transition:'all .15s' }}>{p}</button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ════ NORMAL RANK VIEW ════ */}
        {isRankView && <>

        {/* Table header with inline search */}
        <div className="table-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,0,30,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b71113' }}>{Ico.table(20)}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1A2340' }}>ຕາຕະລາງຈັດອັນດັບ</div>
              <div style={{ fontSize: 12, color: '#838380', marginTop: 1, fontWeight: 600 }}>{rows.length} ຄົນ{activeRank ? ` · ${rankLabel(activeRank.group_name, activeRank.dept_name, activeRank.id)}` : ' * ຈັດອັນດັບລວມ ທຄຕລ ທົ່ວລະບົບ'}</div>
            </div>
          </div>
          {/* Search — near table */}
          <div className="table-search" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', boxShadow: '0 4px 16px rgba(10,22,40,.12)', borderRadius: 24 }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#A0B0C8', display: 'flex', pointerEvents: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input
                id="pub-search-input"
                type="text"
                placeholder="ຄົ້ນຫາ ຊື່ ຫຼື ລະຫັດ..."
                defaultValue={search}
                onKeyDown={e => {
                  if (e.key === 'Enter') { setSearch((e.target as HTMLInputElement).value); setPage(1) }
                  if (e.key === 'Escape') { (e.target as HTMLInputElement).value = ''; setSearch(''); setPage(1) }
                }}
                style={{ padding: '8px 36px 8px 36px', borderRadius: '24px 0 0 24px', borderTop: `1.5px solid ${search ? '#b71113' : '#E2E8F0'}`, borderLeft: `1.5px solid ${search ? '#b71113' : '#E2E8F0'}`, borderBottom: `1.5px solid ${search ? '#b71113' : '#E2E8F0'}`, borderRight: 'none', background: search ? 'rgba(183,17,19,.03)' : '#F5F7FA', fontSize: 13, outline: 'none', width: 220, color: '#1A2340', transition: '.18s' }}
              />
              {search && (
                <button onClick={() => { (document.getElementById('pub-search-input') as HTMLInputElement).value = ''; setSearch(''); setPage(1) }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A0B0C8', display: 'flex', padding: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            {/* Search button */}
            <button
              onClick={() => { const v = (document.getElementById('pub-search-input') as HTMLInputElement)?.value ?? ''; setSearch(v); setPage(1) }}
              style={{ padding: '8px 18px', borderRadius: '0 24px 24px 0', border: '1.5px solid #b71113', background: 'linear-gradient(135deg,#b71113,#8a0c0d)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, transition: '.15s', boxShadow: '0 4px 14px rgba(183,17,19,.35)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              ຄົ້ນຫາ
            </button>
            {search && <span style={{ fontSize: 12, color: '#8A9BB8', fontWeight: 600, whiteSpace: 'nowrap' }}>{rows.length} ຜົນ</span>}
          </div>
        </div>

        {/* Modern table */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E8EBF5', overflow: 'hidden', boxShadow: '0 8px 44px rgba(10,22,40,.33)' }}>

          {/* Sticky thead */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  {[
                    { label: 'ລໍາດັບ',             align: 'center' },
                    { label: 'ຊື່ ແລະ ນາມສະກຸນ',   align: 'left'   },
                    { label: 'ຂະແໜງ/ໜ່ວຍບໍລິການ', align: 'left'   },
                    { label: 'ສູນ/ພະແນກ/ສາຂາ',   align: 'left'   },
                    { label: 'ຄະແນນລວມ',        align: 'right'  },
                    { label: 'ໝາຍເຫດ',          align: 'center' },
                  ].map((c, i) => (
                    <th key={i} style={{
                      padding: '13px 16px',
                      textAlign: c.align as React.CSSProperties['textAlign'],
                      fontSize: 12, fontWeight: 700,
                      letterSpacing: '1.5px', textTransform: 'uppercase',
                      color: 'rgb(255, 255, 255)', whiteSpace: 'nowrap',
                      background: '#b71113',
                      borderBottom: '3px solid #8a0c0d',
                    }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => {
                  const pct        = maxScore > 0 ? (Number(r.total_score) / maxScore * 100) : 0
                  const isCentury  = Number(r.total_score) >= 100
                  const isTop3     = r.no <= 3 && isCentury
                  const isTop5     = r.no <= 5 && isCentury
                  const idx        = r.no - 1
                  const MedalSvg   = isTop3 ? MEDAL_SVGS[Math.min(idx, 2)] : null
                  const scoreColor = isTop3 ? M_COLOR[idx] : isCentury ? '#B07800' : '#b71113'
                  const barGrad    = isTop3
                    ? `linear-gradient(90deg,${M_RING[idx]},${M_COLOR[idx]})`
                    : isCentury ? 'linear-gradient(90deg,#D4A017,#FFB800)'
                    : 'linear-gradient(90deg,#b71113,#d93032)'
                  const rowBg      = isTop3 ? `${M_RING[idx]}0D` : isCentury ? 'rgba(212,160,23,.03)' : undefined

                  return (
                    <React.Fragment key={r.user_id}>
                    <tr style={{
                      borderBottom: '1px solid #F5F7FA',
                      background: rowBg,
                      opacity: animated ? 1 : 0,
                      transition: `opacity .3s ${Math.min(i * .014, .4)}s, background .15s`,
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(183,17,19,.035)')}
                      onMouseLeave={e => (e.currentTarget.style.background = rowBg ?? '')}
                    >
                      {/* Rank */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', width: 56 }}>
                        {isTop3 && MedalSvg
                          ? <div style={{ display:'flex', justifyContent:'center' }}>{MedalSvg(36)}</div>
                          : isTop5
                            ? <div style={{ display:'flex', justifyContent:'center' }}>
                                <AwardBadge no={r.no} size={36} />
                              </div>
                            : <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F2F4FA', border: '1.5px solid #E8EBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#838380', margin: '0 auto' }}>
                                {r.no}
                              </div>
                        }
                      </td>

                      {/* Name + avatar */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Avatar */}
                          <EmpPhoto fingerCode={r.finger_code} name={r.fullname} size={40} border="2px solid #fff" shadow="0 1px 4px rgba(0,0,0,.12)" onZoom={(src) => setZoomData({ src, row: r })} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, color: '#0A1628', fontSize: 13.5, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{r.fullname}</span>
                              {isCentury && (
                                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', animation: 'glow 2.5s ease-in-out infinite' }}>{Ico.award(18)}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 12, color: '#838380', fontFamily: 'Vidaloka' }}>{r.user_id}</span>
                              {r.position && <span style={{ fontSize: 12, padding: '1px 6px', borderRadius: 5, background: '#EEF1F6', color: '#7A8BAA', fontWeight: 600 }}>{r.position}</span>}
                              {isCentury && (
                                <span style={{ display:'inline-flex', alignItems:'center', gap: 3, padding: '2px 7px', borderRadius: 8, background: 'linear-gradient(135deg,rgba(255,215,0,.2),rgba(255,140,0,.12))', border: '1px solid rgba(212,160,23,.35)', fontSize: 12, fontWeight: 800, color: '#A07000' }}>
                                  100+
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector (now 3rd column) */}
                      <td style={{ padding: '12px 16px' }}>
                        {r.sector
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 8, background: '#F0F4FF', color: '#4A6AC8', fontSize: 12, fontWeight: 600 }}>
                              {Ico.building(11)} {fmtUnit(r.sector)}
                            </span>
                          : <span style={{ color: '#C8D0E0', fontSize: 12 }}>—</span>
                        }
                      </td>

                      {/* Department (now 4th column) */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#b71113', opacity: .5, flexShrink: 0, display: 'flex' }}>{Ico.mappin(12)}</span>
                          <span style={{ fontSize: 12, color: '#3A5070', fontWeight: 500 }}>{fmtUnit(r.department) || '—'}</span>
                        </div>
                      </td>

                      {/* Score + bar */}
                      <td style={{ padding: '12px 20px 12px 16px', minWidth: 130 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                          <div style={{ fontFamily: "'Vidaloka',serif", fontWeight: 900, fontSize: 16, color: scoreColor, letterSpacing: '-.3px' }}>{fmt(r.total_score)}</div>
                          <div style={{ width: 90, height: 5, borderRadius: 99, background: '#EEF1F6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 99, background: barGrad, width: animated ? `${pct}%` : '0%', transition: `width .8s ${Math.min(i * .014, .4)}s cubic-bezier(.4,0,.2,1)` }} />
                          </div>
                        </div>
                      </td>

                      {/* Detail button */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', width: 90 }}>
                        <button
                          onClick={() => setModalRow(r)}
                          style={{ padding: '6px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F7F9FF', color: '#4A5578', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#b71113'; (e.currentTarget as HTMLButtonElement).style.color = '#b71113'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(183,17,19,.04)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.color = '#4A5578'; (e.currentTarget as HTMLButtonElement).style.background = '#F7F9FF' }}
                        >
                          ລາຍລະອຽດ
                        </button>
                      </td>
                    </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid #F0F2FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#FAFBFF' }}>
              <div style={{ fontSize: 12, color: '#8A9BB8', fontWeight: 600 }}>ໜ້າ <strong style={{ color: '#b71113' }}>{page}</strong> / {pageCount} · {rows.length} ຄົນ</div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[
                  { icon: Ico.chevLL(), action: () => setPage(1),           disabled: page === 1 },
                  { icon: Ico.chevL(),  action: () => setPage(p => p - 1), disabled: page === 1 },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} disabled={btn.disabled} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid', borderColor: btn.disabled ? '#EEF1F6' : '#E2E8F0', background: btn.disabled ? '#F5F7FA' : '#fff', color: btn.disabled ? '#C8D0E0' : '#3A4A6A', cursor: btn.disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{btn.icon}</button>
                ))}

                {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
                  const p = pageCount <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pageCount - 3 ? pageCount - 6 + i : page - 3 + i
                  const isActive = page === p
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid', borderColor: isActive ? '#b71113' : '#E2E8F0', background: isActive ? 'linear-gradient(135deg,#b71113,#8a0c0d)' : '#fff', color: isActive ? '#fff' : '#6878A0', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: isActive ? '0 3px 10px rgba(183,17,19,.3)' : 'none', transition: 'all .15s' }}>{p}</button>
                  )
                })}

                {[
                  { icon: Ico.chevR(),  action: () => setPage(p => p + 1), disabled: page === pageCount },
                  { icon: Ico.chevRR(), action: () => setPage(pageCount),   disabled: page === pageCount },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} disabled={btn.disabled} style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px solid', borderColor: btn.disabled ? '#EEF1F6' : '#E2E8F0', background: btn.disabled ? '#F5F7FA' : '#fff', color: btn.disabled ? '#C8D0E0' : '#3A4A6A', cursor: btn.disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{btn.icon}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        </>}

      </main>

      {/* ── Footer — BCEL style (blue, like bcel.com.la) ── */}
      <footer>
        <div>
          <div className="f-brand">BCEL — <em>ລາງວັນ Teller ດີເດັ່ນ 2026</em></div>
          <div className="f-sub">ທະນາຄານພາຍນອກລາວ (ມະຫາຊົນ) · BANQUE POUR LE COMMERCE EXTÉRIEUR LAO PUBLIC</div>
        </div>
        <div className="f-links">
          <a href="https://www.bcel.com.la" target="_blank" rel="noreferrer" className="f-link">🌐 bcel.com.la</a>
        </div>
        <div className="f-dt">
          {rows.length} ຄົນ · {activeDept ? 1 : (activeRank?.dept_count ?? '—')} ສາຂາ<br />
          © 2026 BCEL
        </div>
      </footer>
    </div>

    {/* ── Photo zoom lightbox ── */}
    {zoomData && (() => {
      const { src, row } = zoomData
      return (
        <div
          onClick={() => setZoomData(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', animation: 'fadeIn .18s ease',
            padding: 16,
          }}
        >
          {/* Card */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, overflow: 'hidden',
              width: 'min(340px, 92vw)', boxShadow: '0 20px 80px rgba(0,0,0,.5)',
              animation: 'scaleIn .22s cubic-bezier(.34,1.56,.64,1)',
              cursor: 'default',
            }}
          >
            {/* Big photo */}
            <div style={{ position: 'relative', width: '100%', background: '#111' }}>
              <img
                src={src}
                alt={row.fullname}
                style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
              />
              {/* Gradient overlay at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.4) 60%, transparent 100%)', pointerEvents: 'none' }} />
              {/* Name + ID + info over photo */}
              <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-lao)', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>{row.fullname}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2, fontFamily: 'Vidaloka' }}>{row.user_id}</div>
              </div>
            </div>

          </div>

          {/* Close button */}
          <button
            onClick={() => setZoomData(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,.15)', border: 'none',
              color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
      )
    })()}
    </>
  )
}
