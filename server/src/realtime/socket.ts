import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { verifyToken } from '../lib/jwt.js'
import { logger } from '../lib/logger.js'
import { UserModel } from '../models/index.js'
import { realtime, type ServerToClientEvents } from './notifier.js'

interface SocketData {
  userId: string
}

const room = (userId: string) => `user:${userId}`

export function attachSocketServer(httpServer: HttpServer, allowedOrigins: string[]) {
  const io = new Server<
    Record<string, never>,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, { cors: { origin: allowedOrigins, credentials: false } })

  // Authenticate the handshake with the same JWT the REST API uses. v1 trusted a raw
  // `userId` query param, which let anyone subscribe to anyone else's messages.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    const userId = typeof token === 'string' ? verifyToken(token) : null
    if (!userId || !(await UserModel.exists({ _id: userId }))) {
      return next(new Error('unauthorized'))
    }
    socket.data.userId = userId
    next()
  })

  // Presence: count sockets per user so multiple tabs don't flap online/offline.
  const connections = new Map<string, number>()

  io.on('connection', (socket) => {
    const { userId } = socket.data
    void socket.join(room(userId))

    const count = (connections.get(userId) ?? 0) + 1
    connections.set(userId, count)
    if (count === 1) socket.broadcast.emit('presence:update', { userId, online: true })
    socket.emit('presence:init', { online: [...connections.keys()] })

    socket.on('disconnect', () => {
      const remaining = (connections.get(userId) ?? 1) - 1
      if (remaining > 0) {
        connections.set(userId, remaining)
      } else {
        connections.delete(userId)
        io.emit('presence:update', { userId, online: false })
      }
    })
  })

  realtime.register({
    toUsers(userIds, event, ...args) {
      const rooms = [...new Set(userIds)].map(room)
      if (rooms.length === 0) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(io.to(rooms).emit as any)(event, ...args)
    },
  })

  logger.info('Socket.IO attached')
  return io
}
