import { describe, it, expect } from '@jest/globals'
import { db } from '@/lib/db'
import { grantDownloadPermissions } from '@/lib/permissions'
import {
  createUser, createSeller, createProgram,
  createProgramFile, createPaidOrder
} from '../helpers/factories'

describe('다운로드 권한 부여 (grantDownloadPermissions)', () => {
  it('파일 수만큼 권한이 생성된다', async () => {
    const buyer = await createUser()
    const seller = await createSeller()
    const program = await createProgram(seller.id)
    await createProgramFile(program.id)
    await createProgramFile(program.id)
    const order = await createPaidOrder(buyer.id, program.id)

    await grantDownloadPermissions(order.id)

    const perms = await db.downloadPermission.findMany({ where: { order_id: order.id } })
    expect(perms).toHaveLength(2)
    expect(perms.every(p => p.buyer_id === buyer.id)).toBe(true)
    expect(perms.every(p => p.max_downloads === 5)).toBe(true)
    expect(perms.every(p => p.is_revoked === false)).toBe(true)
  })

  it('중복 호출 시 권한이 중복 생성되지 않는다 (skipDuplicates)', async () => {
    const buyer = await createUser()
    const seller = await createSeller()
    const program = await createProgram(seller.id)
    await createProgramFile(program.id)
    const order = await createPaidOrder(buyer.id, program.id)

    await grantDownloadPermissions(order.id)
    await grantDownloadPermissions(order.id) // 두 번 호출

    const perms = await db.downloadPermission.findMany({ where: { order_id: order.id } })
    expect(perms).toHaveLength(1)
  })

  it('미리보기 파일(is_preview=true)은 권한 대상에서 제외된다', async () => {
    const buyer = await createUser()
    const seller = await createSeller()
    const program = await createProgram(seller.id)
    await createProgramFile(program.id, { is_preview: false })
    await createProgramFile(program.id, { is_preview: true }) // 제외되어야 함
    const order = await createPaidOrder(buyer.id, program.id)

    await grantDownloadPermissions(order.id)

    const perms = await db.downloadPermission.findMany({ where: { order_id: order.id } })
    expect(perms).toHaveLength(1)
  })
})
