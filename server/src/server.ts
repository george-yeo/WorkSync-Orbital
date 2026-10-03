import { createServer } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './db/connect.js'
import { logger } from './lib/logger.js'
import { startDemoMode } from './modules/demo/demo.service.js'
import { attachSocketServer } from './realtime/socket.js'

async function main() {
  // Connect first and fail loudly: v1 swallowed connection errors and never bound the port,
  // which looked like a silent hang on the host.
  await connectDatabase(env.MONGO_URI)

  const app = createApp()
  const httpServer = createServer(app)
  const io = attachSocketServer(httpServer, env.CLIENT_ORIGIN)
  const stopDemo = env.DEMO_ENABLED ? await startDemoMode() : () => {}

  httpServer.listen(env.PORT, () => logger.info(`API listening on :${env.PORT}`))

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down')
    stopDemo()
    await io.close()
    httpServer.close()
    await disconnectDatabase()
    process.exit(0)
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection')
})

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server')
  process.exit(1)
})
