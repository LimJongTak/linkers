import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/auth'

// 공개 엔드포인트: 무료 샘플 파일 다운로드 (로그인 불필요)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const program = await db.program.findUnique({
      where: { id, status: 'active' },
      select: { id: true, title: true },
    })
    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')

    const previewFile = await db.programFile.findFirst({
      where: { program_id: id, is_preview: true },
    })
    if (!previewFile) throw new ApiError(404, 'NO_SAMPLE_FILE')

    const s3Key = previewFile.s3_key

    // 로컬 파일 → public URL로 리다이렉트
    if (s3Key.startsWith('_local_:')) {
      const publicPath = s3Key.replace('_local_:', '/')
      return Response.redirect(new URL(publicPath, _req.url))
    }

    // Supabase Storage → signed URL 생성
    if (s3Key.startsWith('_supabase_:')) {
      const storagePath = s3Key.replace('_supabase_:', '')
      const { getSupabaseSignedUrl } = await import('@/lib/supabase-storage')
      const signedUrl = await getSupabaseSignedUrl(storagePath)
      return Response.redirect(signedUrl)
    }

    // S3 → presigned URL 생성
    const { getDownloadPresignedUrl } = await import('@/lib/s3')
    const signedUrl = await getDownloadPresignedUrl(s3Key, previewFile.file_name)
    return Response.redirect(signedUrl)
  } catch (err) {
    return handleError(err)
  }
}
