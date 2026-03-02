import { db } from './db'

export async function grantDownloadPermissions(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      program: {
        include: { files: { where: { is_preview: false } } },
      },
    },
  })
  if (!order) throw new Error(`Order not found: ${orderId}`)

  await db.downloadPermission.createMany({
    data: order.program.files.map((file) => ({
      order_id: orderId,
      buyer_id: order.buyer_id,
      program_file_id: file.id,
      max_downloads: 5,
    })),
    skipDuplicates: true, // Webhook + Verify 경쟁 조건 방지
  })
}
