import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuid } from 'uuid'

const s3 = new S3Client({ region: process.env.AWS_REGION! })
const BUCKET = process.env.AWS_S3_BUCKET!

// 서버에서 직접 업로드
export async function uploadFile(
  file: Buffer,
  originalName: string,
  mimeType: string,
  programId: string
): Promise<{ s3Key: string }> {
  const ext = originalName.split('.').pop()
  const s3Key = `programs/${programId}/${uuid()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: file,
      ContentType: mimeType,
      Metadata: { originalName },
      ServerSideEncryption: 'AES256',
    })
  )

  return { s3Key }
}

// 클라이언트 직접 업로드용 Presigned PUT URL (10분)
export async function getUploadPresignedUrl(
  programId: string,
  fileName: string,
  mimeType: string
) {
  const ext = fileName.split('.').pop()
  const s3Key = `programs/${programId}/${uuid()}.${ext}`

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: mimeType }),
    { expiresIn: 600 }
  )

  return { uploadUrl, s3Key }
}

// 다운로드용 Presigned GET URL (15분)
export async function getDownloadPresignedUrl(
  s3Key: string,
  fileName: string
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    }),
    { expiresIn: 900 }
  )
}

export async function deleteFile(s3Key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }))
}
