import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { apiLimiter } from './middleware/rate-limit.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { chatRouter } from './modules/chat/chat.routes.js'
import { groupsRouter } from './modules/groups/groups.routes.js'
import { listsRouter } from './modules/lists/lists.routes.js'
import { meRouter } from './modules/me/me.routes.js'
import { tasksRouter } from './modules/tasks/tasks.routes.js'
import { usersRouter } from './modules/users/users.routes.js'

export function createApp() {
  const app = express()

  // Behind the hosting platform's load balancer: trust the first proxy hop for client IPs.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(
    helmet({
      // Avatars are loaded cross-origin by the separately hosted client.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(cors({ origin: env.CLIENT_ORIGIN, maxAge: 86_400 }))
  app.use(express.json({ limit: '100kb' }))
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }))

  app.get('/api/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'up' : 'down'
    res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'ok' : 'degraded', db })
  })

  const api = express.Router()
  api.use(apiLimiter)
  api.use('/auth', authRouter)
  api.use('/me', meRouter)
  api.use('/users', usersRouter)
  api.use('/lists', listsRouter)
  api.use('/tasks', tasksRouter)
  api.use('/groups', groupsRouter)
  api.use('/chats', chatRouter)
  app.use('/api', api)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
