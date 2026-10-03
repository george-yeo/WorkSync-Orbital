import { pino } from 'pino'
import { env, isProd, isTest } from '../config/env.js'

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  ...(isProd || isTest
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, singleLine: true } } }),
})
