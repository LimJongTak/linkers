import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken, handleError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = verifyAccessToken(req)

    const permissions = await db.downloadPermission.findMany({
      where: { buyer_id: user.userId, is_revoked: false },
      include: {
        program_file: {
          select: { id: true, file_name: true, file_type: true, file_size: true },
        },
        order: {
          select: {
            id: true,
            program: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { granted_at: 'desc' },
    })

    const files = permissions.map(p => ({
      permissionId: p.id,
      fileId: p.program_file_id,
      fileName: p.program_file.file_name,
      fileType: p.program_file.file_type,
      fileSize: p.program_file.file_size.toString(),
      programTitle: p.order.program.title,
      programId: p.order.program.id,
      downloadCount: p.download_count,
      maxDownloads: p.max_downloads,
      remaining: p.max_downloads - p.download_count,
    }))

    return Response.json({ files })
  } catch (err) {
    return handleError(err)
  }
}
