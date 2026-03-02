'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { NOTICES } from '@/store/data'

const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  '공지':     { bg: '#EFF6FF', color: '#1D4ED8' },
  '업데이트': { bg: '#F0FDF4', color: '#15803D' },
  '이벤트':   { bg: '#FFF7ED', color: '#C2410C' },
}

export default function NoticesPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div style={{ fontFamily: "'Pretendard Variable', Pretendard, -apple-system, sans-serif", minHeight: '100vh', background: '#F7F6F3' }}>
      <Header />

      <section style={{ background: 'linear-gradient(135deg, #111827, #1F2D45)', padding: '44px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 20, marginBottom: 14 }}>공지사항</div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, color: '#fff', marginBottom: 10 }}>링커스 공지사항</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>서비스 업데이트와 이벤트 소식을 확인하세요</p>
      </section>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px 60px' }}>
        {NOTICES.map(n => {
          const badge = BADGE_COLOR[n.category] ?? { bg: '#F3F4F6', color: '#374151' }
          const isOpen = open === n.id
          return (
            <div key={n.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0EDE8', marginBottom: 10, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
              <button
                onClick={() => setOpen(isOpen ? null : n.id)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '20px 24px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: badge.bg, color: badge.color, flexShrink: 0 }}>{n.category}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {n.title}
                    {n.isNew && <span style={{ fontSize: 10, background: '#EF4444', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>NEW</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{n.date}</div>
                </div>
                <span style={{ fontSize: 18, color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>⌃</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid #F3F4F6' }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, paddingTop: 16 }}>{n.content}</p>
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
