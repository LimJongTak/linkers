/**
 * Supabase Storage helper using REST API (no SDK required)
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
 */

function getConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required')
  return { url, key }
}

export function hasSupabaseStorage(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
}

/**
 * Upload a file to Supabase Storage
 * @returns public URL of the uploaded file
 */
export async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string,
  bucket = 'programs'
): Promise<string> {
  const { url, key } = getConfig()

  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase Storage upload failed: ${err}`)
  }

  return `${url}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromSupabase(path: string, bucket = 'programs'): Promise<void> {
  const { url, key } = getConfig()

  await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${key}` },
  })
}

/**
 * Get a signed URL for downloading a private file (1 hour expiry)
 */
export async function getSupabaseSignedUrl(path: string, bucket = 'programs'): Promise<string> {
  const { url, key } = getConfig()

  const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: 3600 }),
  })

  if (!res.ok) throw new Error('Failed to generate signed URL')
  const data = await res.json()
  return `${url}/storage/v1${data.signedURL}`
}
