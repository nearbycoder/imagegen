import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

interface UploadResult {
  url: string
  key: string
  width?: number
  height?: number
}

/**
 * Upload a base64-encoded image to R2
 */
export async function uploadBase64Image(
  base64Data: string,
  folder: string,
): Promise<UploadResult> {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not configured')
  }

  // Handle different input types
  if (typeof base64Data !== 'string') {
    console.error('Invalid base64Data type:', typeof base64Data, base64Data)
    throw new Error(`Expected string, got ${typeof base64Data}`)
  }

  // If it's a URL, fetch the image first
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    const response = await fetch(base64Data)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const contentType = response.headers.get('content-type') || 'image/png'
    const extension = contentType.split('/')[1] || 'png'

    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const key = `${folder}/${timestamp}-${randomString}.${extension}`

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )

    // Generate signed URL for viewing (valid for 7 days)
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })

    const signedUrl = await getSignedUrl(r2Client, getCommand, {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    })

    return { url: signedUrl, key }
  }

  // Extract the base64 content and content type
  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)

  if (!matches || matches.length !== 3) {
    console.error(
      'Invalid base64 format. Data preview:',
      base64Data.substring(0, 100),
    )
    throw new Error('Invalid base64 image data format')
  }

  const contentType = matches[1]
  const base64Content = matches[2]

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Content, 'base64')

  // Generate a unique key
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = contentType.split('/')[1] || 'png'
  const key = `${folder}/${timestamp}-${randomString}.${extension}`

  // Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  // Generate signed URL for viewing (valid for 7 days)
  const getCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  })

  const signedUrl = await getSignedUrl(r2Client, getCommand, {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    url: signedUrl,
    key,
  }
}

/**
 * Upload a file buffer to R2
 */
export async function uploadFile(
  buffer: Buffer,
  folder: string,
  fileName: string,
  contentType: string,
): Promise<UploadResult> {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not configured')
  }

  // Generate a unique key
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = fileName.split('.').pop() || 'bin'
  const key = `${folder}/${timestamp}-${randomString}.${extension}`

  // Upload to R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  // Generate signed URL for viewing (valid for 7 days)
  const getCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  })

  const signedUrl = await getSignedUrl(r2Client, getCommand, {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  })

  return {
    url: signedUrl,
    key,
  }
}

/**
 * Generate a presigned URL for uploading directly from the client
 */
export async function generatePresignedUploadUrl(
  folder: string,
  fileName: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error('R2_BUCKET_NAME is not configured')
  }

  // Generate a unique key
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = fileName.split('.').pop() || 'bin'
  const key = `${folder}/${timestamp}-${randomString}.${extension}`

  // Generate presigned URL for PUT
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return {
    uploadUrl,
    key,
    publicUrl,
  }
}

export { r2Client }
