import { NextRequest } from 'next/server'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { db } from '@/lib/db'
import { grantDownloadPermissions } from '@/lib/permissions'
import { v4 as uuid } from 'uuid'
import { hasSupabaseStorage, uploadToSupabase } from '@/lib/supabase-storage'

// S3 자격증명이 모두 설정된 경우에만 S3 사용
function hasS3() {
  return !!(
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  )
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const program = await db.program.findUnique({ where: { id } })
    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')
    if (program.seller_id !== user.userId) throw new ApiError(403, 'FORBIDDEN')

    const contentType = req.headers.get('content-type') ?? ''

    let fileName: string, s3Key: string, fileSize: number, fileType: string
    let isPreview = false, sortOrder = 0

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const fileEntry = formData.get('file') as File | null
      if (!fileEntry) throw new ApiError(400, 'file required')

      isPreview = formData.get('isPreview') === 'true'
      sortOrder = Number(formData.get('sortOrder') ?? 0)
      fileName  = fileEntry.name
      fileType  = fileEntry.type || 'application/octet-stream'
      fileSize  = fileEntry.size

      const buffer = Buffer.from(await fileEntry.arrayBuffer())

      if (hasS3()) {
        // S3 자격증명 완비 시 S3에 업로드
        const { uploadFile } = await import('@/lib/s3')
        const result = await uploadFile(buffer, fileName, fileType, id)
        s3Key = result.s3Key
      } else if (hasSupabaseStorage()) {
        // Supabase Storage 사용
        const ext = fileName.split('.').pop() || 'bin'
        const savedName = `${uuid()}.${ext}`
        const storagePath = `${id}/${savedName}`
        await uploadToSupabase(buffer, storagePath, fileType)
        s3Key = `_supabase_:${storagePath}`
      } else if (process.env.NODE_ENV !== 'production') {
        // 로컬 파일시스템에 저장 (개발 환경 fallback)
        const fs = await import('fs/promises')
        const path = await import('path')
        const ext = fileName.split('.').pop() || 'bin'
        const savedName = `${uuid()}.${ext}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', id)
        await fs.mkdir(uploadDir, { recursive: true })
        await fs.writeFile(path.join(uploadDir, savedName), buffer)
        s3Key = `_local_:uploads/${id}/${savedName}`
      } else {
        throw new ApiError(500, '파일 스토리지가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_SERVICE_KEY를 설정해주세요.')
      }
    } else {
      // JSON 방식 (외부에서 S3 presigned URL 업로드 후 메타 등록)
      const body = await req.json()
      ;({ fileName, s3Key, fileSize, fileType, isPreview = false, sortOrder = 0 } = body)
      if (!fileName || !s3Key || fileSize == null || !fileType) {
        throw new ApiError(400, 'fileName, s3Key, fileSize, fileType required')
      }
    }

    const file = await db.programFile.create({
      data: {
        program_id: id,
        file_name: fileName!,
        s3_key: s3Key!,
        file_size: BigInt(fileSize!),
        file_type: fileType!,
        is_preview: isPreview,
        sort_order: sortOrder,
      },
    })

    // 기존 결제 완료 주문에도 이 파일에 대한 다운로드 권한 소급 부여
    if (!isPreview) {
      const paidOrders = await db.order.findMany({
        where: { program_id: id, status: { in: ['paid', 'confirmed'] } },
        select: { id: true },
      })
      await Promise.allSettled(paidOrders.map(o => grantDownloadPermissions(o.id)))
    }

    return Response.json({ file: { ...file, file_size: file.file_size.toString() } }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const program = await db.program.findUnique({ where: { id } })
    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')
    if (program.seller_id !== user.userId) throw new ApiError(403, 'FORBIDDEN')

    const files = await db.programFile.findMany({
      where: { program_id: id },
      orderBy: { sort_order: 'asc' },
    })

    return Response.json({ files: files.map(f => ({ ...f, file_size: f.file_size.toString() })) })
  } catch (err) {
    return handleError(err)
  }
}
