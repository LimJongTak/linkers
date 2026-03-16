import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleError, ApiError } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const program = await db.program.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, nickname: true, profile_image: true } },
        files: {
          select: { id: true, file_name: true, file_type: true, file_size: true, is_preview: true, sort_order: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    })

    if (!program) throw new ApiError(404, 'PROGRAM_NOT_FOUND')

    return Response.json({
      program: {
        ...program,
        files: program.files.map(f => ({ ...f, file_size: f.file_size.toString() })),
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
