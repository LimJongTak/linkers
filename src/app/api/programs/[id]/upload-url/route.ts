import { NextRequest } from 'next/server'
import { verifyAccessToken, handleError, ApiError } from '@/lib/auth'
import { getUploadPresignedUrl } from '@/lib/s3'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = verifyAccessToken(req)
    const { id } = await params

    const program = await db.program.findUnique({ where: { id } })
    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')
    if (program.seller_id !== user.userId) throw new ApiError(403, 'FORBIDDEN')

    const { fileName, contentType } = await req.json()
    if (!fileName || !contentType) throw new ApiError(400, 'fileName and contentType required')

    const result = await getUploadPresignedUrl(id, fileName, contentType)
    return Response.json(result)
  } catch (err) {
    return handleError(err)
  }
}
