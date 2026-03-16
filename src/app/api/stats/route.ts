import { db } from '@/lib/db'
import { handleError } from '@/lib/auth'

export async function GET() {
  try {
    const [totalPrograms, totalDownloads, ratingResult] = await Promise.all([
      db.program.count({ where: { status: 'active' } }),
      db.downloadPermission.count(),
      db.program.aggregate({
        where: { status: 'active', review_count: { gt: 0 } },
        _avg: { rating_avg: true },
      }),
    ])

    const avgRating = ratingResult._avg.rating_avg
      ? parseFloat(String(ratingResult._avg.rating_avg)).toFixed(1)
      : null

    return Response.json({ totalPrograms, totalDownloads, avgRating })
  } catch (err) {
    return handleError(err)
  }
}
