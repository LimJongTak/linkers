'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { PROGRAMS, type Program } from '@/store/data'

const CATEGORIES = ['전체','레크리에이션','교육','진로','예체능','재능봉사']
const TARGETS    = ['전체','초등','중등','고등']
const REGIONS    = ['전체','서울','경기','인천','부산','전국']
const SORTS: [string,string][] = [['popular','인기순'],['rating','별점순'],['price_asc','가격↑'],['price_desc','가격↓'],['recent','최신순']]

const fmt = (n: number) => n === 0 ? '무료' : `${n.toLocaleString()}원`
const cardGrad = (c: string) => ({'레크리에이션':'#E0F2FE,#BAE6FD','교육':'#EDE9FE,#DDD6FE','진로':'#FEF3C7,#FDE68A','예체능':'#FCE7F3,#FBCFE8','재능봉사':'#D1FAE5,#A7F3D0'}[c]??'#F3F4F6,#E5E7EB')

export default function HomePage() {
  const [cat,setCat]=useState('전체')
  const [tgt,setTgt]=useState('전체')
  const [rgn,setRgn]=useState('전체')
  const [srt,setSrt]=useState('popular')
  const [q,setQ]=useState('')

  const list = useMemo(()=>{
    let r=PROGRAMS.filter(p=>{
      if(cat!=='전체'&&p.category!==cat)return false
      if(tgt!=='전체'&&!p.target.includes(tgt))return false
      if(rgn!=='전체'&&!p.region.includes(rgn)&&!p.region.includes('전국'))return false
      if(q&&!p.title.includes(q)&&!p.tags.some(t=>t.includes(q)))return false
      return true
    })
    if(srt==='rating')r=[...r].sort((a,b)=>b.rating-a.rating)
    if(srt==='price_asc')r=[...r].sort((a,b)=>a.price-b.price)
    if(srt==='price_desc')r=[...r].sort((a,b)=>b.price-a.price)
    if(srt==='popular')r=[...r].sort((a,b)=>b.reviewCount-a.reviewCount)
    return r
  },[cat,tgt,rgn,srt,q])

  return (
    <div style={{fontFamily:"'Pretendard Variable',Pretendard,-apple-system,sans-serif",minHeight:'100vh',background:'#F7F6F3'}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px;}
        .chip{padding:7px 16px;border-radius:20px;border:1.5px solid #E5E7EB;background:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;font-family:inherit;color:#374151;white-space:nowrap;}
        .chip.on{background:#111827;color:#fff;border-color:#111827;}
        .chip:hover:not(.on){border-color:#9CA3AF;}
        .sort-btn{padding:7px 14px;border-radius:8px;border:1.5px solid #E5E7EB;background:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#374151;transition:all 0.15s;}
        .sort-btn.on{background:#111827;color:#fff;border-color:#111827;}
        .card{background:#fff;border-radius:18px;border:1px solid #F0EDE8;overflow:hidden;transition:all 0.2s;display:flex;flex-direction:column;text-decoration:none;color:inherit;}
        .card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.10);transform:translateY(-3px);}
        .tag{font-size:11px;background:#F3F4F6;color:#6B7280;padding:3px 8px;border-radius:4px;font-weight:600;}
        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}
        .fscroll{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px;}
        .fscroll::-webkit-scrollbar{display:none;}
        @media(max-width:640px){.pgrid{grid-template-columns:1fr;}}
      `}</style>

      <Header />

      {/* 히어로 */}
      <section style={{background:'linear-gradient(135deg,#111827 0%,#1F2D45 60%,#111827 100%)',padding:'52px 24px 48px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 20% 80%,rgba(79,195,247,0.12) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(139,92,246,0.08) 0%,transparent 50%)'}} />
        <div style={{position:'relative',maxWidth:640,margin:'0 auto'}}>
          <div style={{display:'inline-block',background:'rgba(79,195,247,0.15)',color:'#4FC3F7',fontSize:12,fontWeight:800,padding:'5px 14px',borderRadius:20,marginBottom:16}}>대학생 × 학교 연결 플랫폼</div>
          <h1 style={{fontSize:'clamp(22px,5vw,38px)',fontWeight:900,color:'#fff',lineHeight:1.25,marginBottom:14,letterSpacing:'-0.5px'}}>
            우리 학교에 딱 맞는<br/><span style={{color:'#4FC3F7'}}>교육 프로그램</span>을 찾아보세요
          </h1>
          <p style={{fontSize:15,color:'rgba(255,255,255,0.6)',marginBottom:28}}>레크리에이션 · 진로탐색 · 교과특강 · 봉사활동 · 예체능</p>
          <div style={{position:'relative',maxWidth:480,margin:'0 auto'}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="프로그램명, 태그로 검색..."
              style={{width:'100%',padding:'14px 52px 14px 20px',borderRadius:14,border:'none',fontSize:15,fontFamily:'inherit',outline:'none',fontWeight:500,background:'rgba(255,255,255,0.95)',color:'#111827'}} />
            <span style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',fontSize:20,opacity:0.4}}>🔍</span>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:32,marginTop:28}}>
            {[['142+','등록 프로그램'],['2,800+','누적 구매'],['4.9★','평균 별점']].map(([v,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:20,fontWeight:900,color:'#fff'}}>{v}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 필터 */}
      <div style={{background:'#fff',borderBottom:'1px solid #F0EDE8',padding:'14px 24px'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div className="fscroll" style={{marginBottom:10}}>
            {CATEGORIES.map(c=><button key={c} className={`chip ${cat===c?'on':''}`} onClick={()=>setCat(c)}>{c}</button>)}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:12,color:'#9CA3AF',fontWeight:700}}>대상</span>
            {TARGETS.map(t=><button key={t} className={`chip ${tgt===t?'on':''}`} style={{padding:'5px 12px',fontSize:12}} onClick={()=>setTgt(t)}>{t}</button>)}
            <div style={{width:1,height:18,background:'#E5E7EB',margin:'0 4px'}} />
            <span style={{fontSize:12,color:'#9CA3AF',fontWeight:700}}>지역</span>
            {REGIONS.map(r=><button key={r} className={`chip ${rgn===r?'on':''}`} style={{padding:'5px 12px',fontSize:12}} onClick={()=>setRgn(r)}>{r}</button>)}
            <div style={{flex:1}} />
            <div className="fscroll" style={{gap:6}}>
              {SORTS.map(([v,l])=><button key={v} className={`sort-btn ${srt===v?'on':''}`} onClick={()=>setSrt(v)}>{l}</button>)}
            </div>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <main style={{maxWidth:1200,margin:'0 auto',padding:'28px 24px 60px'}}>
        <div style={{fontSize:14,color:'#6B7280',marginBottom:20}}>
          총 <strong style={{color:'#111827'}}>{list.length}</strong>개 프로그램
          {q&&<span style={{marginLeft:4}}>— &ldquo;<strong>{q}</strong>&rdquo;</span>}
        </div>
        {list.length===0 ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'#9CA3AF'}}>
            <div style={{fontSize:48,marginBottom:16}}>🔍</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>검색 결과가 없어요</div>
            <div style={{fontSize:14}}>필터를 조정하거나 다른 키워드로 검색해보세요</div>
          </div>
        ):(
          <div className="pgrid">{list.map(p=><PCard key={p.id} p={p}/>)}</div>
        )}
      </main>

      {/* 푸터 */}
      <footer style={{background:'#111827',padding:'32px 24px',textAlign:'center'}}>
        <div style={{fontSize:16,fontWeight:900,color:'#fff',marginBottom:8}}>링커스<span style={{color:'#4FC3F7'}}>.</span></div>
        <div style={{display:'flex',justifyContent:'center',gap:20,marginBottom:12}}>
          {[['/', '프로그램 찾기'],['/sellers','인기 판매자'],['/notices','공지사항']].map(([h,l])=>(
            <Link key={h} href={h} style={{fontSize:12,color:'rgba(255,255,255,0.5)',textDecoration:'none'}}>{l}</Link>
          ))}
        </div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>© 2025 Linkers. 학교 교육 프로그램 중개 플랫폼</div>
      </footer>
    </div>
  )
}

function PCard({p}:{p:Program}) {
  return (
    <Link href={`/programs/${p.id}`} className="card">
      <div style={{height:140,background:`linear-gradient(135deg,${cardGrad(p.category)})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,position:'relative'}}>
        {p.icon}
        {p.badge&&<span style={{position:'absolute',top:12,left:12,background:p.badgeColor,color:'#fff',fontSize:11,fontWeight:800,padding:'3px 9px',borderRadius:6}}>{p.badge}</span>}
        <span style={{position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.35)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:5,backdropFilter:'blur(4px)'}}>{p.category}</span>
      </div>
      <div style={{padding:'16px 16px 0',flex:1}}>
        <div style={{fontSize:15,fontWeight:800,color:'#111827',lineHeight:1.35,marginBottom:4}}>{p.title}</div>
        <div style={{fontSize:12,color:'#9CA3AF',marginBottom:10}}>{p.subtitle}</div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12,paddingBottom:12,borderBottom:'1px solid #F3F4F6'}}>
          <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#667EEA,#764BA2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff',fontWeight:800,flexShrink:0}}>{p.seller[0]}</div>
          <span style={{fontSize:12,color:'#374151',fontWeight:700}}>{p.seller}</span>
          <span style={{fontSize:11,color:'#9CA3AF'}}>{p.university}</span>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>
          {p.target.map(t=><span key={t} className="tag">{t}</span>)}
          {p.region.slice(0,2).map(r=><span key={r} className="tag">📍{r}</span>)}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div>
            <span style={{fontSize:17,fontWeight:900,color:p.price===0?'#10B981':'#111827'}}>{fmt(p.price)}</span>
            {p.price>0&&<span style={{fontSize:11,color:'#9CA3AF',marginLeft:3}}>/ 1회</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{color:'#F59E0B',fontSize:14}}>★</span>
            <span style={{fontSize:13,fontWeight:800,color:'#111827'}}>{p.rating}</span>
            <span style={{fontSize:11,color:'#9CA3AF'}}>({p.reviewCount})</span>
          </div>
        </div>
      </div>
      <div style={{padding:'0 16px 16px'}}>
        <div style={{width:'100%',background:'#111827',color:'#fff',borderRadius:10,padding:'11px',fontSize:14,fontWeight:800,textAlign:'center'}}>지금 신청하기 →</div>
      </div>
    </Link>
  )
}
