import sharp from 'sharp'
import { badRequest } from './http-error.js'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const OUTPUT_SIZE = 256

/**
 * Decode the uploaded bytes (rejecting anything that isn't actually an image, regardless of the
 * client-declared MIME type), strip metadata, centre-crop to a square and re-encode as WebP.
 */
export async function processAvatar(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input, { limitInputPixels: 40_000_000, animated: false })
      .rotate()
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'attention' })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    throw badRequest('The uploaded file is not a supported image (PNG, JPEG, WebP or GIF)')
  }
}
