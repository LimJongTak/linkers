import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, requireRole, handleError, ApiError } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = verifyAccessToken(req)
    requireRole(admin, 'admin', 'manager')

    const { id } = await params
    const { action, role, points, reason, nickname, phone, email } = await req.json()

    const target = await db.user.findUnique({ where: { id } })
    if (!target) throw new ApiError(404, 'USER_NOT_FOUND')

    if (action === 'change_role') {
      // 역할 변경은 관리자만 가능
      if (admin.role !== 'admin') throw new ApiError(403, '역할 변경은 관리자만 가능합니다')
      if (!['buyer', 'seller', 'manager', 'admin'].includes(role)) throw new ApiError(400, 'INVALID_ROLE')

      // 매니저 역할은 관리자만 부여/변경 가능
      if ((role === 'manager' || target.role === 'manager') && admin.role !== 'admin') {
        throw new ApiError(403, '매니저 역할은 관리자만 변경할 수 있습니다')
      }

      // 관리자 역할은 관리자만 부여 가능하며 최대 3명
      if (role === 'admin') {
        if (admin.role !== 'admin') throw new ApiError(403, '관리자 역할은 관리자만 부여할 수 있습니다')
        const adminCount = await db.user.count({ where: { role: 'admin' } })
        if (adminCount >= 3) throw new ApiError(400, '관리자는 최대 3명까지만 설정할 수 있습니다')
      }

      const updated = await db.user.update({
        where: { id },
        data: { role },
        select: { id: true, nickname: true, role: true },
      })
      return Response.json({ user: updated })
    }

    if (action === 'grant_points') {
      const amount = parseInt(points)
      if (!amount || amount <= 0 || amount > 1_000_000) throw new ApiError(400, 'INVALID_AMOUNT')
      const updated = await db.user.update({
        where: { id },
        data: {
          points: { increment: amount },
          point_transactions: {
            create: {
              amount,
              type: 'charge_admin',
              description: reason ? `관리자 지급: ${reason}` : '관리자 포인트 지급',
            },
          },
        },
        select: { id: true, nickname: true, points: true },
      })
      return Response.json({ user: updated })
    }

    if (action === 'deduct_points') {
      const amount = parseInt(points)
      if (!amount || amount <= 0) throw new ApiError(400, 'INVALID_AMOUNT')
      if (target.points < amount) throw new ApiError(400, 'INSUFFICIENT_POINTS')
      const updated = await db.user.update({
        where: { id },
        data: {
          points: { decrement: amount },
          point_transactions: {
            create: {
              amount: -amount,
              type: 'charge_admin',
              description: reason ? `관리자 차감: ${reason}` : '관리자 포인트 차감',
            },
          },
        },
        select: { id: true, nickname: true, points: true },
      })
      return Response.json({ user: updated })
    }

    if (action === 'update_profile') {
      const data: Record<string, string | null> = {}
      if (nickname !== undefined) {
        if (typeof nickname !== 'string' || nickname.trim().length < 2) throw new ApiError(400, '닉네임은 2자 이상이어야 합니다')
        data.nickname = nickname.trim()
      }
      if (phone !== undefined) data.phone = phone || null
      if (email !== undefined) {
        if (admin.role !== 'admin') throw new ApiError(403, '이메일 변경은 관리자만 가능합니다')
        data.email = email || null
      }
      if (Object.keys(data).length === 0) throw new ApiError(400, '변경할 항목이 없습니다')
      const updated = await db.user.update({
        where: { id },
        data,
        select: { id: true, nickname: true, email: true, phone: true, role: true },
      })
      return Response.json({ user: updated })
    }

    throw new ApiError(400, 'INVALID_ACTION')
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = verifyAccessToken(req)
    requireRole(admin, 'admin')
    const { id } = await params
    const { secret, hardDelete } = await req.json()

    if (!secret || secret !== process.env.ADMIN_INIT_SECRET) {
      throw new ApiError(403, '관리자 시크릿 키가 올바르지 않습니다')
    }
    if (admin.userId === id) throw new ApiError(400, '자기 자신은 탈퇴시킬 수 없습니다')

    const target = await db.user.findUnique({ where: { id } })
    if (!target) throw new ApiError(404, '사용자를 찾을 수 없습니다')

    if (hardDelete) {
      // 완전 삭제: 탈퇴 회원(익명화된) DB 레코드 영구 삭제
      if (target.oauth_provider !== 'deleted') {
        throw new ApiError(400, '탈퇴 처리된 회원만 완전 삭제할 수 있습니다')
      }

      await db.$transaction(async (tx) => {
        // 연관 ID 수집
        const orderIds = (await tx.order.findMany({ where: { buyer_id: id }, select: { id: true } })).map(o => o.id)
        const programIds = (await tx.program.findMany({ where: { seller_id: id }, select: { id: true } })).map(p => p.id)
        const programOrderIds = programIds.length > 0
          ? (await tx.order.findMany({ where: { program_id: { in: programIds } }, select: { id: true } })).map(o => o.id)
          : []
        const allOrderIds = [...new Set([...orderIds, ...programOrderIds])]

        const permissionIds = (await tx.downloadPermission.findMany({ where: { buyer_id: id }, select: { id: true } })).map(p => p.id)
        const programFileIds = programIds.length > 0
          ? (await tx.programFile.findMany({ where: { program_id: { in: programIds } }, select: { id: true } })).map(f => f.id)
          : []
        const programPermissionIds = programFileIds.length > 0
          ? (await tx.downloadPermission.findMany({ where: { program_file_id: { in: programFileIds } }, select: { id: true } })).map(p => p.id)
          : []
        const allPermissionIds = [...new Set([...permissionIds, ...programPermissionIds])]

        const userInquiryIds = (await tx.inquiry.findMany({ where: { user_id: id }, select: { id: true } })).map(i => i.id)
        const programInquiryIds = programIds.length > 0
          ? (await tx.inquiry.findMany({ where: { program_id: { in: programIds } }, select: { id: true } })).map(i => i.id)
          : []
        const allInquiryIds = [...new Set([...userInquiryIds, ...programInquiryIds])]

        const createdCouponIds = (await tx.coupon.findMany({ where: { created_by: id }, select: { id: true } })).map(c => c.id)
        const programCouponIds = programIds.length > 0
          ? (await tx.coupon.findMany({ where: { program_id: { in: programIds } }, select: { id: true } })).map(c => c.id)
          : []
        const allCouponIds = [...new Set([...createdCouponIds, ...programCouponIds])]

        // 1. SignedUrlLog
        if (allPermissionIds.length > 0) await tx.signedUrlLog.deleteMany({ where: { permission_id: { in: allPermissionIds } } })

        // 2. DownloadPermission
        if (allPermissionIds.length > 0) await tx.downloadPermission.deleteMany({ where: { id: { in: allPermissionIds } } })

        // 3. CouponUsage
        if (allCouponIds.length > 0) await tx.couponUsage.deleteMany({ where: { coupon_id: { in: allCouponIds } } })
        if (allOrderIds.length > 0) await tx.couponUsage.deleteMany({ where: { order_id: { in: allOrderIds } } })
        await tx.couponUsage.deleteMany({ where: { user_id: id } })

        // 4. Review
        if (allOrderIds.length > 0) await tx.review.deleteMany({ where: { order_id: { in: allOrderIds } } })

        // 5. Payment
        if (allOrderIds.length > 0) await tx.payment.deleteMany({ where: { order_id: { in: allOrderIds } } })

        // 6. Settlement
        await tx.settlement.deleteMany({ where: { seller_id: id } })
        if (allOrderIds.length > 0) await tx.settlement.deleteMany({ where: { order_id: { in: allOrderIds } } })

        // 7. Order
        if (allOrderIds.length > 0) await tx.order.deleteMany({ where: { id: { in: allOrderIds } } })

        // 8. PointTransaction
        await tx.pointTransaction.deleteMany({ where: { user_id: id } })

        // 9. Withdrawal
        await tx.withdrawal.deleteMany({ where: { seller_id: id } })

        // 10. InquiryReply
        await tx.inquiryReply.deleteMany({ where: { author_id: id } })
        if (allInquiryIds.length > 0) await tx.inquiryReply.deleteMany({ where: { inquiry_id: { in: allInquiryIds } } })

        // 11. Inquiry
        await tx.inquiry.deleteMany({ where: { user_id: id } })
        if (programIds.length > 0) await tx.inquiry.deleteMany({ where: { program_id: { in: programIds } } })

        // 12. Notice
        await tx.notice.deleteMany({ where: { author_id: id } })

        // 13. Report
        await tx.report.deleteMany({ where: { reporter_id: id } })
        await tx.report.updateMany({ where: { reviewer_id: id }, data: { reviewer_id: null } })

        // 14. UserCoupon, Coupon
        if (allCouponIds.length > 0) {
          await tx.userCoupon.deleteMany({ where: { coupon_id: { in: allCouponIds } } })
          await tx.coupon.deleteMany({ where: { id: { in: allCouponIds } } })
        }
        await tx.userCoupon.deleteMany({ where: { user_id: id } })

        // 15. DepositRequest
        await tx.depositRequest.deleteMany({ where: { user_id: id } })

        // 16. Program (cascade → ProgramFile, Wishlist, CartItem, Report)
        if (programIds.length > 0) await tx.program.deleteMany({ where: { id: { in: programIds } } })

        // 17. User
        await tx.user.delete({ where: { id } })
      })

      return Response.json({ success: true, deleted: true })
    }

    // 일반 탈퇴: 개인정보 익명화 (기록 보존, PII 삭제)
    await db.user.update({
      where: { id },
      data: {
        email: null,
        nickname: '탈퇴한 사용자',
        phone: null,
        profile_image: null,
        password_hash: null,
        oauth_provider: 'deleted',
        oauth_id: randomUUID(),
        points: 0,
      },
    })

    return Response.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
