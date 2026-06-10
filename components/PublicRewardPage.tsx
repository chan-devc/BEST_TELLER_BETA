'use client'

import { useState, useEffect, useRef } from 'react'

interface TellerEntry {
  rank: number
  user: string
  name: string
  unit: string
  branch: string
  score: number
}

interface Announcement {
  id: number
  title_lo: string
  title_en: string
  body: string
  tag: string
  created_at: string
}

interface SheetData {
  cat: string
  type: string
  label: string
  emoji: string
  sort_order: number
  scoreField?: 'score' | 'amount'
  data: TellerEntry[]
}

const CATS: Record<string, { label: string; emoji: string }> = {
  'award':  { label: 'ລາງວັນຫຼັກ',       emoji: '🏆' },
  'opc':    { label: 'OPC & ບໍລິການ',     emoji: '🖥' },
  'branch': { label: 'ແຕ່ລະສາຂາ',        emoji: '🏦' },
  'prize':  { label: 'ລາງວັນການຂາຍ',     emoji: '💰' },
}

// ── Portrait system ─────────────────────────────────────────────────────────
function getPortraitDef(userCode: string) {
  let h = 0
  for (let i = 0; i < userCode.length; i++) h = (h * 31 + userCode.charCodeAt(i)) & 0xFFFFFF
  return {
    skinL:    ['#F5C8A0','#F2C49A','#E8B07A','#D4946A','#C88050','#DCA870','#D89860','#C07848','#B06840','#BF8060'][h%10],
    skinS:    ['#DDA070','#D8A070','#C48A50','#B87040','#A06030','#B88050','#B07840','#985828','#885020','#9A6040'][h%10],
    hairTop:  ['#0D0500','#100800','#0E0600','#150800','#0A0400','#100600','#180A00','#0C0600','#1A1008','#0E0800'][h%7],
    hairHL:   ['#3D1A00','#2A1200','#200E00','#402000','#180A00','#2A1000','#481800','#1C0C00','#504848','#281400'][h%7],
    lipCol:   ['#D44A3A','#C04040','#A04838','#C83A50','#984030','#A04434','#CC4050','#904030','#884030','#984438'][h%10],
    eyeCol:   ['#5C3010','#3A2008','#2A1800','#4A2812','#241400','#302010','#501C10','#201000','#1A1008','#281808'][h%10],
    gender:   h % 3 === 0 ? 'm' : 'f',
    hairStyle:['long','medium','bun','short','wavy','side','buzz','medium','long','short'][h%10],
    smile:    h % 3 !== 2,
    bg1:      ['#E8D0C0','#D8C8B0','#C8D0C0','#E0D0D8','#C8C0A8','#C0C8D0','#E0C8D0','#C0C8A8','#B8B8B8','#C8D0C0'][h%10],
    bg2:      ['#C8A890','#B8A080','#A8B0A0','#C0A8B0','#A8A080','#A0A8B8','#C0A0A8','#A0A880','#989890','#A8B098'][h%10],
  }
}

function buildPortrait(userCode: string, sz: number): string {
  const p = getPortraitDef(userCode)
  const uid = userCode.replace(/[^a-zA-Z0-9]/g, '') + sz
  const cx = sz / 2, cy = sz / 2, sc = sz / 100
  const fx = cx, fy = cy + 6 * sc
  const fRx = 21 * sc, fRy = 25 * sc

  let hair = ''
  if (p.hairStyle === 'long') {
    hair = `<ellipse cx="${fx}" cy="${fy+fRy*.3}" rx="${fRx*1.28}" ry="${fRy*1.1}" fill="${p.hairTop}"/>
    <ellipse cx="${fx-fRx*.82}" cy="${fy}" rx="${fRx*.24}" ry="${fRy*.52}" fill="${p.hairTop}"/>
    <ellipse cx="${fx+fRx*.82}" cy="${fy}" rx="${fRx*.24}" ry="${fRy*.52}" fill="${p.hairTop}"/>
    <ellipse cx="${fx}" cy="${fy-fRy*.62}" rx="${fRx*.78}" ry="${fRy*.36}" fill="${p.hairHL}" opacity=".15"/>`
  } else if (p.hairStyle === 'bun') {
    hair = `<ellipse cx="${fx}" cy="${fy+fRy*.3}" rx="${fRx*1.18}" ry="${fRy*.85}" fill="${p.hairTop}"/>
    <ellipse cx="${fx}" cy="${fy-fRy*.9}" rx="${fRx*.42}" ry="${fRy*.28}" fill="${p.hairTop}"/>
    <ellipse cx="${fx}" cy="${fy-fRy*.62}" rx="${fRx*.78}" ry="${fRy*.36}" fill="${p.hairHL}" opacity=".15"/>`
  } else if (p.hairStyle === 'short' || p.hairStyle === 'buzz') {
    hair = `<ellipse cx="${fx}" cy="${fy-fRy*.15}" rx="${fRx*1.15}" ry="${fRy*.72}" fill="${p.hairTop}"/>
    <ellipse cx="${fx}" cy="${fy-fRy*.62}" rx="${fRx*.78}" ry="${fRy*.36}" fill="${p.hairHL}" opacity=".15"/>`
  } else {
    hair = `<ellipse cx="${fx}" cy="${fy+fRy*.15}" rx="${fRx*1.22}" ry="${fRy*.95}" fill="${p.hairTop}"/>
    <ellipse cx="${fx-fRx*.7}" cy="${fy}" rx="${fRx*.22}" ry="${fRy*.45}" fill="${p.hairTop}"/>
    <ellipse cx="${fx+fRx*.7}" cy="${fy}" rx="${fRx*.22}" ry="${fRy*.45}" fill="${p.hairTop}"/>
    <ellipse cx="${fx}" cy="${fy-fRy*.62}" rx="${fRx*.78}" ry="${fRy*.36}" fill="${p.hairHL}" opacity=".15"/>`
  }

  const neckTop = fy + fRy * .68, neckBot = fy + fRy * 1.12, nW = 10 * sc
  const uniformY = neckBot - 2 * sc
  const uniform = p.gender === 'f'
    ? `<path d="M${fx-sz*.5} ${sz} Q${fx-sz*.18} ${uniformY+8*sc} ${fx} ${uniformY+3*sc} Q${fx+sz*.18} ${uniformY+8*sc} ${fx+sz*.5} ${sz} Z" fill="#003F8A"/>
       <path d="M${fx-6*sc} ${uniformY+2*sc} L${fx} ${uniformY+16*sc} L${fx+6*sc} ${uniformY+2*sc}" fill="white" opacity=".85"/>`
    : `<path d="M${fx-sz*.5} ${sz} Q${fx-sz*.18} ${uniformY+8*sc} ${fx} ${uniformY+3*sc} Q${fx+sz*.18} ${uniformY+8*sc} ${fx+sz*.5} ${sz} Z" fill="#101828"/>
       <rect x="${fx-2.5*sc}" y="${uniformY+4*sc}" width="${5*sc}" height="${13*sc}" fill="#CC0000" rx="${1.5*sc}"/>`

  const ey = fy - fRy * .18, ex1 = fx - fRx * .38, ex2 = fx + fRx * .38
  const eW = fRx * .36, eH = fRy * .21
  const mY = fy + fRy * .44, mW = fRx * .38
  const lips = p.smile
    ? `<path d="M${fx-mW} ${mY} Q${fx-mW*.35} ${mY-fRy*.07} ${fx} ${mY-fRy*.05} Q${fx+mW*.35} ${mY-fRy*.07} ${fx+mW} ${mY}" fill="${p.lipCol}" opacity=".5"/>
       <path d="M${fx-mW} ${mY} Q${fx} ${mY+fRy*.14} ${fx+mW} ${mY}" fill="${p.lipCol}" opacity=".7"/>
       <path d="M${fx-mW*.48} ${mY+fRy*.02} Q${fx} ${mY+fRy*.07} ${fx+mW*.48} ${mY+fRy*.02}" fill="${p.skinL}" opacity=".55"/>`
    : `<path d="M${fx-mW*.55} ${mY} Q${fx} ${mY+fRy*.04} ${fx+mW*.55} ${mY}" fill="none" stroke="${p.lipCol}" stroke-width="${1.6*sc}" stroke-linecap="round" opacity=".75"/>`

  const badgeY = neckBot + 10 * sc
  return `<svg viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg${uid}" cx="50%" cy="35%" r="60%"><stop offset="0%" stop-color="${p.bg1}"/><stop offset="100%" stop-color="${p.bg2}"/></radialGradient>
    <clipPath id="cl${uid}"><circle cx="${cx}" cy="${cy}" r="${sz/2}"/></clipPath>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${sz/2}" fill="url(#bg${uid})"/>
  <g clip-path="url(#cl${uid})">
    ${hair}
    <rect x="${fx-nW}" y="${neckTop}" width="${nW*2}" height="${neckBot-neckTop}" fill="${p.skinL}" rx="${nW*.3}"/>
    <rect x="${fx-nW*.18}" y="${neckTop}" width="${nW*.36}" height="${(neckBot-neckTop)*.55}" fill="${p.skinS}" rx="${nW*.08}" opacity=".3"/>
    ${uniform}
    <ellipse cx="${fx}" cy="${fy}" rx="${fRx}" ry="${fRy}" fill="${p.skinL}"/>
    <ellipse cx="${fx-fRx*.58}" cy="${fy}" rx="${fRx*.23}" ry="${fRy*.62}" fill="${p.skinS}" opacity=".1"/>
    <ellipse cx="${fx+fRx*.58}" cy="${fy}" rx="${fRx*.23}" ry="${fRy*.62}" fill="${p.skinS}" opacity=".1"/>
    <ellipse cx="${fx}" cy="${fy+fRy*.68}" rx="${fRx*.48}" ry="${fRy*.2}" fill="${p.skinS}" opacity=".13"/>
    <ellipse cx="${ex1}" cy="${ey}" rx="${eW}" ry="${eH}" fill="white"/>
    <ellipse cx="${ex2}" cy="${ey}" rx="${eW}" ry="${eH}" fill="white"/>
    <ellipse cx="${ex1+eW*.08}" cy="${ey}" rx="${eW*.56}" ry="${eH*.8}" fill="${p.eyeCol}"/>
    <ellipse cx="${ex2+eW*.08}" cy="${ey}" rx="${eW*.56}" ry="${eH*.8}" fill="${p.eyeCol}"/>
    <ellipse cx="${ex1+eW*.08}" cy="${ey}" rx="${eW*.3}" ry="${eH*.48}" fill="#040101"/>
    <ellipse cx="${ex2+eW*.08}" cy="${ey}" rx="${eW*.3}" ry="${eH*.48}" fill="#040101"/>
    <ellipse cx="${ex1-eW*.14}" cy="${ey-eH*.26}" rx="${eW*.12}" ry="${eH*.2}" fill="white" opacity=".7"/>
    <ellipse cx="${ex2-eW*.14}" cy="${ey-eH*.26}" rx="${eW*.12}" ry="${eH*.2}" fill="white" opacity=".7"/>
    <path d="M${ex1-eW} ${ey-eH*.28} Q${ex1} ${ey-eH*1.3} ${ex1+eW} ${ey-eH*.28}" fill="${p.hairTop}" opacity=".82"/>
    <path d="M${ex2-eW} ${ey-eH*.28} Q${ex2} ${ey-eH*1.3} ${ex2+eW} ${ey-eH*.28}" fill="${p.hairTop}" opacity=".82"/>
    <path d="M${fx} ${fy+fRy*.12} Q${fx-fRx*.2} ${fy+fRy*.22} ${fx-fRx*.18} ${fy+fRy*.18} Q${fx} ${fy+fRy*.24} ${fx+fRx*.18} ${fy+fRy*.18} Q${fx+fRx*.2} ${fy+fRy*.22} ${fx} ${fy+fRy*.12}" fill="${p.skinS}" opacity=".18"/>
    <ellipse cx="${ex1-eW*.28}" cy="${ey+eH*2.4}" rx="${fRx*.25}" ry="${fRy*.1}" fill="#FF8888" opacity=".1"/>
    <ellipse cx="${ex2+eW*.28}" cy="${ey+eH*2.4}" rx="${fRx*.25}" ry="${fRy*.1}" fill="#FF8888" opacity=".1"/>
    ${lips}
    <ellipse cx="${fx}" cy="${fy+fRy*.83}" rx="${fRx*.22}" ry="${fRy*.09}" fill="white" opacity=".1"/>
    <rect x="${fx-13*sc}" y="${badgeY}" width="${26*sc}" height="${6.5*sc}" rx="${2*sc}" fill="#F5C518" opacity=".88"/>
    <text x="${fx}" y="${badgeY+5*sc}" text-anchor="middle" fill="#9A0000" font-size="${4.2*sc}px" font-weight="700" font-family="Arial,sans-serif">BCEL</text>
  </g></svg>`
}

function Portrait({ user, sz, gold = false }: { user: string; sz: number; gold?: boolean }) {
  const ring = sz > 60
    ? `0 0 0 3px #D4A017, 0 0 0 6px rgba(245,197,24,.25)`
    : `0 0 0 1.5px #E2E8F0`
  return (
    <div style={{ position: 'relative', width: sz, height: sz, flexShrink: 0 }}>
      <div dangerouslySetInnerHTML={{ __html: buildPortrait(user, sz) }} />
      <div style={{ position: 'absolute', inset: sz > 60 ? -4 : -2, borderRadius: '50%', boxShadow: gold ? `0 0 0 3px #D4A017, 0 0 0 6px rgba(245,197,24,.25)` : ring, pointerEvents: 'none' }} />
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PublicRewardPage() {
  const [sheets, setSheets] = useState<Record<string, SheetData>>({})
  const [totalTellers, setTotalTellers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeSheet, setActiveSheet] = useState('')
  const [barsAnimated, setBarsAnimated] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/excel-data').then(r => r.json()),
      fetch('/api/public/announcements').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([d, a]) => {
      setSheets(d.sheets ?? {})
      setTotalTellers(d.totalTellers ?? 0)
      const first = Object.keys(d.sheets ?? {})[0]
      if (first) setActiveSheet(first)
      setAnnouncements(a.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setBarsAnimated(false)
    const t = setTimeout(() => setBarsAnimated(true), 200)
    return () => clearTimeout(t)
  }, [activeSheet])

  const activeCat = sheets[activeSheet]?.cat ?? ''
  const sv = sheets[activeSheet]

  // Build ticker message
  const tellerTicker = Object.values(sheets).map(s => ({ ...s.data[0], scoreField: s.scoreField })).filter(Boolean)
    .map(t => `${t.name} (${t.branch}) — ${t.score.toFixed(1)} ${t.scoreField === 'amount' ? 'ຈຳນວນ' : 'ຄະແນນ'}`).join(' 🌼 ')
  const annTicker = announcements.map(a => `📣 ${a.title_lo}`).join(' · ')
  const tickerMsg = [annTicker, tellerTicker].filter(Boolean).join(' ✦ ') + ' 🌼 '

  // Sheet tabs for current cat
  const catSheets = Object.entries(sheets).filter(([, v]) => v.cat === activeCat)

  // Stats for current sheet
  const scores = sv?.data.map(d => d.score) ?? []
  const maxScore = scores.length ? Math.max(...scores) : 100
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const branches = sv ? Array.from(new Set(sv.data.map(d => d.branch))).length : 0
  const top = sv?.data[0]

  if (loading) {
    return (
      <div className="pub-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#6878A0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontFamily: "'Noto Sans Lao','Times New Roman',serif", fontSize: 20, fontWeight: 700 }}>ກຳລັງໂຫຼດ...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pub-page">
      {/* Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          <span>{tickerMsg}</span>
          <span>{tickerMsg}</span>
        </div>
      </div>

      {/* Topbar */}
      <div className="topbar">
        <div className="tb-l">
          ທະນາຄານພາຍນອກລາວ (ມະຫາຊົນ) &nbsp;|&nbsp; <strong>BANQUE POUR LE COMMERCE EXTERIEUR LAO PUBLIC</strong>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>ຂໍ້ມູນ ນະ 13 ມີນາ 2026</div>
      </div>

      {/* Nav */}
      <nav>
        <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="https://www.bcel.com.la/bcel/resources/imgs/logobcel.png" alt="BCEL Logo" width="42" height="42" style={{ objectFit: 'contain' }} />
          <div>
            <div className="brand-name">BCEL</div>
            <div className="brand-sub">Best Teller Award 2026</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        </div>
      </nav>
      <div className="sr" /><div className="st" />

      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-in">
          <div>
            <div className="eyebrow"><div className="dot" /> ຜົນລ້າສຸດ · Best Teller Award 2026</div>
            <h1 className="h1">ລາງວັນ<em>ພະນັກງານ</em></h1>
            <h1 className="h1"><span className="ul">ດີເດັ່ນ</span> 2026</h1>

            <p className="hero-lao">BCEL Best Teller Performance Award</p>
            <p className="hero-desc">ປະກາດຜົນຜູ້ຊະນະທຸກໝວດ: ໜ່ວຍບໍລິການ, ຂະແໜງບໍລິການ, ຄັງເງີນສົດ, ສູນບໍລິການ OPC ທົ່ວທຸກສາຂາ BCEL ທົ່ວປະເທດ.</p>
            <div className="chips">
              <div className="chip">📊 {Object.keys(sheets).length} ໝວດ</div>
              <div className="chip">👥 {totalTellers} ຄົນ</div>
              <div className="chip">🏢 ທົ່ວທຸກສາຂາ</div>
              <div className="chip">🇱🇦 ລາວ 2026</div>
            </div>
          </div>
          <div className="trophy-panel">
            <div className="trophy-card">
              <div className="ti">🏆</div>
              <div className="ytag">2026</div>
              <div className="tlabel">Best Teller Award</div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="cat-bar">
          {Object.entries(CATS).map(([cat, info]) => {
            const count = Object.values(sheets).filter(s => s.cat === cat).length
            if (count === 0) return null
            return (
              <div
                key={cat}
                className={`cat-tab${activeCat === cat ? ' on' : ''}`}
                onClick={() => {
                  const first = Object.entries(sheets).find(([, v]) => v.cat === cat)
                  if (first) setActiveSheet(first[0])
                }}
              >
                {info.emoji} {info.label} <span className="cat-badge">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sheet pills */}
      <div className="sheet-bar">
        <div className="sheet-bar-in">
          {catSheets.map(([key, v]) => (
            <div
              key={key}
              className={`sheet-pill${activeSheet === key ? ' on' : ''}`}
              onClick={() => setActiveSheet(key)}
            >
              {v.emoji} {v.label} <span className="sheet-count">{v.data.length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="content" ref={contentRef}>
        {/* Announcements */}
        {announcements.length > 0 && (
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.map(a => {
              const tagColors: Record<string, { bg: string; color: string; label: string }> = {
                new:   { bg: '#E8F0FA', color: '#003F8A', label: '🆕 ໃໝ່' },
                perf:  { bg: '#E6F7F0', color: '#0A7A50', label: '📊 ຜົນງານ' },
                event: { bg: '#FFF9E0', color: '#A07800', label: '📅 ງານ' },
                q1:    { bg: '#FFF0F0', color: '#CC0000', label: '🏆 Q1' },
              }
              const tc = tagColors[a.tag] ?? tagColors.new
              return (
                <div key={a.id} style={{ background: '#fff', border: '1px solid var(--border)', borderLeft: `4px solid ${tc.color}`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: tc.bg, color: tc.color }}>{tc.label}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: a.title_en || a.body ? 3 : 0 }}>{a.title_lo}</div>
                    {a.title_en && <div style={{ fontSize: 14, color: 'var(--tmid)', marginBottom: a.body ? 4 : 0 }}>{a.title_en}</div>}
                    {a.body && <div style={{ fontSize: 14, color: 'var(--tmid)', lineHeight: 1.6 }}>{a.body}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tlt)', flexShrink: 0, marginTop: 2 }}>{new Date(a.created_at).toLocaleDateString('lo-LA')}</div>
                </div>
              )
            })}
          </div>
        )}

        {sv && (
          <>
            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-card"><div className="stat-icon">👑</div><div className="stat-val">{sv.scoreField === 'amount' ? maxScore.toLocaleString() : maxScore.toFixed(2)}</div><div className="stat-lbl">{sv.scoreField === 'amount' ? 'ຈຳນວນສູງສຸດ' : 'ຄະແນນສູງສຸດ'}</div></div>
              <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-val">{sv.scoreField === 'amount' ? avgScore.toFixed(0) : avgScore.toFixed(1)}</div><div className="stat-lbl">ສະເລ່ຍ</div></div>
              <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-val">{sv.data.length}</div><div className="stat-lbl">ຈຳນວນຄົນ</div></div>
              <div className="stat-card"><div className="stat-icon">🏢</div><div className="stat-val">{branches}</div><div className="stat-lbl">ສາຂາ/ໜ່ວຍ</div></div>
            </div>

            {/* Winner Banner */}
            {top && (
              <div className="wbanner">
                <div className="wb">
                  <div className="wb-left">
                    <div className="wb-trophy">🏆</div>
                    <Portrait user={top.user} sz={108} gold />
                    <div className="wb-rank">🥇 ອັນດັບ 1</div>
                  </div>
                  <div>
                    <div className="wb-cat">{sv.emoji} {sv.label}</div>
                    <div className="wb-title">ພະນັກງານດີເດັ່ນ Best Teller</div>
                    <div className="wb-name">{top.name}</div>
                    <div className="wb-meta">
                      <span>🪪 {top.user}</span>
                      <span>🏢 {top.branch}</span>
                      <span>📍 {top.unit}</span>
                    </div>
                    <div className="wb-stats">
                      <div><div className="wbsv">{sv.scoreField === 'amount' ? top.score.toLocaleString() : top.score.toFixed(2)}</div><div className="wbsl">{sv.scoreField === 'amount' ? 'ຈຳນວນ' : 'ຄະແນນລວມ'}</div></div>
                      <div><div className="wbsv">#1</div><div className="wbsl">ອັນດັບ</div></div>
                      <div><div className="wbsv">{sv.data.length}</div><div className="wbsl">ຄູ່ແຂ່ງ</div></div>
                    </div>
                  </div>
                  <div className="wb-right">
                    <div className="circle">
                      <div className="wb-snum">{sv.scoreField === 'amount' ? top.score.toLocaleString() : top.score.toFixed(1)}</div>
                      <div className="wb-slbl">{sv.scoreField === 'amount' ? 'ຈຳນວນ' : 'Score'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Podium Top 3 */}
            <div className="sec-hd">
              <div>
                <div className="sec-t">🏅 Top 3 ຜູ້ຊະນະ</div>
                <div className="sec-sub">{sv.label}</div>
              </div>
            </div>
            <div className="podium-grid">
              {sv.data.slice(0, 3).map((t, i) => {
                const cls = ['pg', 'ps', 'pb'][i]
                const medals = ['🥇', '🥈', '🥉']
                const rnkLbls = ['🥇 ອັນດັບ 1', '🥈 ອັນດັບ 2', '🥉 ອັນດັບ 3']
                return (
                  <div key={i} className={`pc ${cls}`}>
                    <div className="pc-head">
                      <div className="pc-medal">{medals[i]}</div>
                      <div className="pc-portrait">
                        <div dangerouslySetInnerHTML={{ __html: buildPortrait(t.user, 58) }} />
                        <div className="ring" />
                      </div>
                      <div>
                        <div className="pc-rnk">{rnkLbls[i]}</div>
                        <div className="pc-name">{t.name}</div>
                        <div className="pc-meta">{t.user} · {t.branch}</div>
                      </div>
                    </div>
                    <div className="pc-score-row">
                      <div>
                        <div className="pc-score">{sv.scoreField === 'amount' ? t.score.toLocaleString() : t.score.toFixed(2)}</div>
                        <div className="pc-slabel">{sv.scoreField === 'amount' ? 'ຈຳນວນ' : 'ຄະແນນລວມ'}</div>
                      </div>
                    </div>
                    <div className="pc-unit">{t.unit}</div>
                  </div>
                )
              })}
            </div>

            {/* Full Rankings Table */}
            <div className="sec-hd">
              <div>
                <div className="sec-t">📊 ຕາຕະລາງຄະແນນທັງໝົດ</div>
                <div className="sec-sub">ທຸກ {sv.data.length} ຄົນ — {sv.label}</div>
              </div>
            </div>
            <div className="rank-card">
              <div className="rank-head">
                <div className="rank-title">ຜົນ {sv.label}</div>
                <span className="rank-count">{sv.data.length} ຄົນ</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>ອັນດັບ</th>
                      <th>ຊື່ – ນາມສະກຸນ</th>
                      <th>ສາຂາ/ພະແນກ</th>
                      <th>ໜ່ວຍ/ຂະແໜງ</th>
                      <th>ຄະແນນ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sv.data.map((t, i) => {
                      const medals = ['🥇', '🥈', '🥉']
                      const pct = maxScore > 0 ? (t.score / maxScore * 100) : 0
                      return (
                        <tr key={i} className={i === 0 ? 'gld' : ''}>
                          <td className={`rk${i < 3 ? ' top' : ''}`}>
                            {i < 3 ? medals[i] : <span style={{ color: '#6878A0', fontSize: 13 }}>{i + 1}</span>}
                          </td>
                          <td>
                            <div className="trow">
                              <div className="tbl-portrait">
                                <div dangerouslySetInnerHTML={{ __html: buildPortrait(t.user, 42) }} />
                                <div className="ring" />
                              </div>
                              <div>
                                <div className="tname">{t.name}</div>
                                <div className="tid">{t.user}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="ttag">{t.branch}</span></td>
                          <td style={{ maxWidth: 200, fontSize: 13, color: '#6878A0' }}>{t.unit}</td>
                          <td>
                            <div className="sw">
                              <div className="sn">{sv.scoreField === 'amount' ? t.score.toLocaleString() : t.score.toFixed(2)}</div>
                              <div className="sbar">
                                <div className="sfill" style={{ width: barsAnimated ? `${pct}%` : '0%' }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sr" /><div className="st" />

      {/* Footer */}
      <footer>
        <div>
          <div className="f-brand">BCEL — <em>ທະນາຄານພາຍນອກລາວ</em></div>
          <div className="f-sub">BANQUE POUR LE COMMERCE EXTERIEUR LAO PUBLIC · Best Teller Performance Award 2026</div>
        </div>
        <div className="f-dt">ຂໍ້ມູນຈາກ Excel Files · {Object.keys(sheets).length} ໝວດ · ທັງໝົດ {totalTellers} ຄົນ · 2026</div>
      </footer>
    </div>
  )
}
