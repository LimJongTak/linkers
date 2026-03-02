/**
 * 포트원 v2 서버 SDK 초기화 헬퍼
 *
 * @portone/server-sdk 의 버전별 export 방식 차이를 흡수합니다.
 *
 * v0.1.x: import { PortOne } from '@portone/server-sdk'
 * v0.2.x: import PortOne from '@portone/server-sdk'  (default export)
 * v0.3.x+: import * as PortOneSDK ...
 *
 * 실제 설치된 버전의 export를 런타임에서 찾아 초기화합니다.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sdk = require('@portone/server-sdk')

type PortOneClient = {
  payment: {
    getPayment: (paymentId: string) => Promise<any>
  }
  webhook: {
    verify: (secret: string, body: string, headers: Record<string, string>) => Promise<any>
  }
}

function createPortOneClient(apiSecret: string): PortOneClient | null {
  try {
    // 방법 1: named export PortOne (v0.1.x)
    if (sdk.PortOne?.init) return sdk.PortOne.init(apiSecret)
    // 방법 2: default export (v0.2.x)
    if (sdk.default?.init) return sdk.default.init(apiSecret)
    // 방법 3: 직접 init (다른 버전)
    if (typeof sdk.init === 'function') return sdk.init(apiSecret)
    // 방법 4: PortOneClient 클래스
    if (sdk.PortOneClient) return new sdk.PortOneClient(apiSecret)
    return null
  } catch (e) {
    console.error('[PortOne] SDK 초기화 실패:', e)
    return null
  }
}

// 싱글톤 — API Secret 없으면 null (개발 환경 무해 처리)
export const portone: PortOneClient | null = process.env.PORTONE_API_SECRET
  ? createPortOneClient(process.env.PORTONE_API_SECRET)
  : null