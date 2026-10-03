import multer from 'multer'
import { MAX_UPLOAD_BYTES } from '../lib/images.js'

/** Single in-memory image upload; content is validated/re-encoded by sharp afterwards. */
export const imageUpload = (field: string) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  }).single(field)
