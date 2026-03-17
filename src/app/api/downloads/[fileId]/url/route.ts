import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, ApiError, handleError } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const user = verifyAccessToken(req)

    // 1. 권한 확인
    const permission = await db.downloadPermission.findFirst({
      where: {
        buyer_id: user.userId,
        program_file_id: fileId,
        is_revoked: false,
      },
      include: { program_file: true },
    })

    if (!permission) throw new ApiError(403, '다운로드 권한이 없습니다')

    if (permission.download_count >= (permission.max_downloads ?? 5)) {
      throw new ApiError(403, '다운로드 횟수를 초과했습니다')
    }

    const s3Key = permission.program_file.s3_key

    // 2. 다운로드 URL 생성
    let signedUrl: string

    if (s3Key.startsWith('_local_:')) {
      // 로컬 파일시스템에 저장된 경우 직접 URL 반환
      const localPath = s3Key.replace('_local_:', '')
      const base = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000'
      signedUrl = `${base}/${localPath}`
    } else if (s3Key.startsWith('_supabase_:')) {
      // Supabase Storage signed URL 생성 (1시간)
      const storagePath = s3Key.replace('_supabase_:', '')
      const { getSupabaseSignedUrl } = await import('@/lib/supabase-storage')
      signedUrl = await getSupabaseSignedUrl(storagePath)
    } else {
      // S3 presigned URL 생성 (15분)
      const { getDownloadPresignedUrl } = await import('@/lib/s3')
      signedUrl = await getDownloadPresignedUrl(s3Key, permission.program_file.file_name)
    }

    // 3. 카운트 증가 + 로그
    await db.$transaction([
      db.downloadPermission.update({
        where: { id: permission.id },
        data: {
          download_count: { increment: 1 },
          last_downloaded_at: new Date(),
        },
      }),
      db.signedUrlLog.create({
        data: {
          permission_id: permission.id,
          signed_url_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 900_000),
          ip_address: req.headers.get('x-forwarded-for') ?? 'unknown',
          user_agent: req.headers.get('user-agent') ?? '',
        },
      }),
    ])

    return Response.json({
      signedUrl,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      remainingDownloads: (permission.max_downloads ?? 5) - permission.download_count - 1,
    })
  } catch (err) {
    return handleError(err)
  }
}
