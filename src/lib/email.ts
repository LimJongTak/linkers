import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = `링커스 <${process.env.SMTP_USER ?? 'noreply@linkers.kr'}>`
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

async function send(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return // SMTP 미설정 시 skip
  try {
    await transporter.sendMail({ from: FROM, to, subject, html })
  } catch (e) {
    console.error('[Email Error]', e)
  }
}

const wrap = (title: string, body: string) => `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<style>body{font-family:'Apple SD Gothic Neo',sans-serif;background:#F7F6F3;margin:0;padding:24px}
.card{background:#fff;border-radius:16px;padding:32px;max-width:520px;margin:0 auto;border:1px solid #F0EDE8}
.logo{font-size:22px;font-weight:900;color:#111827;letter-spacing:-0.5px;margin-bottom:24px}
.logo span{color:#4FC3F7}.title{font-size:20px;font-weight:800;color:#111827;margin-bottom:12px}
.body{font-size:14px;color:#374151;line-height:1.8;margin-bottom:24px}
.btn{display:inline-block;background:#111827;color:#fff;padding:12px 24px;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none}
.footer{font-size:11px;color:#9CA3AF;margin-top:24px;text-align:center}</style>
</head><body><div class="card">
<div class="logo">링커스<span>.</span></div>
<div class="title">${title}</div>
<div class="body">${body}</div>
<div class="footer">링커스 · 본 메일은 발신 전용입니다</div>
</div></body></html>`

// ── 주문 완료 ──────────────────────────────────────────────
export async function sendOrderPaidEmail(to: string, nickname: string, programTitle: string, amount: number, orderId: string) {
  const html = wrap(
    '결제가 완료되었습니다 ✅',
    `안녕하세요, <strong>${nickname}</strong>님!<br><br>
    <strong>${programTitle}</strong> 구매가 완료되었습니다.<br>
    결제 금액: <strong>${amount.toLocaleString()}원</strong><br><br>
    마이페이지 → 구매 내역에서 파일을 다운로드하세요.
    <br><br><a class="btn" href="${BASE_URL}/my/orders">구매 내역 보기 →</a>`
  )
  await send(to, '[링커스] 결제가 완료되었습니다', html)
}

// ── 환전 처리 ──────────────────────────────────────────────
export async function sendWithdrawalEmail(to: string, nickname: string, amount: number, status: 'completed' | 'rejected', note?: string) {
  const isOk = status === 'completed'
  const html = wrap(
    isOk ? '환전이 처리되었습니다 💸' : '환전 신청이 반려되었습니다',
    `안녕하세요, <strong>${nickname}</strong>님!<br><br>
    ${amount.toLocaleString()}원 환전 신청이 <strong>${isOk ? '완료' : '반려'}</strong>되었습니다.
    ${!isOk && note ? `<br>사유: ${note}` : ''}
    <br><br><a class="btn" href="${BASE_URL}/my/sales">수익금 내역 보기 →</a>`
  )
  await send(to, `[링커스] 환전 신청 ${isOk ? '완료' : '반려'} 안내`, html)
}

// ── 문의 답변 ──────────────────────────────────────────────
export async function sendInquiryAnsweredEmail(to: string, nickname: string, inquiryTitle: string, inquiryId: string) {
  const html = wrap(
    '문의에 답변이 등록되었습니다 💬',
    `안녕하세요, <strong>${nickname}</strong>님!<br><br>
    문의 "<strong>${inquiryTitle}</strong>"에 새로운 답변이 등록되었습니다.
    <br><br><a class="btn" href="${BASE_URL}/my/inquiries/${inquiryId}">답변 확인하기 →</a>`
  )
  await send(to, '[링커스] 1:1 문의 답변이 등록되었습니다', html)
}

// ── 신고 접수 (관리자에게) ──────────────────────────────────
export async function sendReportReceivedEmail(adminEmail: string, programTitle: string, reason: string) {
  const html = wrap(
    '새 신고가 접수되었습니다 🚨',
    `프로그램 "<strong>${programTitle}</strong>"에 대한 신고가 접수되었습니다.<br>
    신고 사유: <strong>${reason}</strong>
    <br><br><a class="btn" href="${BASE_URL}/admin">관리자 콘솔 →</a>`
  )
  await send(adminEmail, '[링커스] 프로그램 신고 접수', html)
}
