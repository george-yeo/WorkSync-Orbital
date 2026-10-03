import type { ErrorRequestHandler, RequestHandler } from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import { HttpError } from '../lib/http-error.js'
import { logger } from '../lib/logger.js'

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details })
    return
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : err.message
    res.status(400).json({ error: message })
    return
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  // Duplicate key from a unique index (e.g. two concurrent signups with the same email).
  if (typeof err === 'object' && err && 'code' in err && err.code === 11000) {
    res.status(409).json({ error: 'That value is already taken' })
    return
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Malformed JSON body' })
    return
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error')
  res.status(500).json({ error: 'Something went wrong on our side' })
}
