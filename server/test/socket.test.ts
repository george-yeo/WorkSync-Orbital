import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { io as connect, type Socket } from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { attachSocketServer } from '../src/realtime/socket.js'
import { app, api, createUser, useDatabase } from './helpers.js'

useDatabase()

let server: Server
let url: string
beforeAll(async () => {
  server = createServer(app)
  attachSocketServer(server, ['http://localhost:5173'])
  await new Promise<void>((r) => server.listen(0, r))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

const open = (token?: string) =>
  new Promise<Socket>((resolve, reject) => {
    const s = connect(url, {
      auth: token ? { token } : {},
      transports: ['websocket'],
      reconnection: false,
    })
    s.on('connect', () => resolve(s))
    s.on('connect_error', (e) => {
      s.close()
      reject(e)
    })
  })

describe('socket auth', () => {
  it('rejects connections without a valid token (v1 trusted a userId query param)', async () => {
    await expect(open()).rejects.toThrow('unauthorized')
    await expect(open('forged.token.value')).rejects.toThrow('unauthorized')
  })

  it('delivers new messages only to channel participants', async () => {
    const a = await createUser('alice')
    const b = await createUser('bob')
    const eve = await createUser('eve')
    const [sb, se] = await Promise.all([open(b.token), open(eve.token)])

    let eveGotIt = false
    se.on('message:new', () => (eveGotIt = true))
    const received = new Promise<{ message: { text: string } }>((r) => sb.on('message:new', r))

    await api()
      .post(`/api/chats/direct/${b.id}/messages`)
      .set(a.auth)
      .send({ text: 'realtime!' })
      .expect(201)
    expect((await received).message.text).toBe('realtime!')
    await new Promise((r) => setTimeout(r, 100))
    expect(eveGotIt).toBe(false)
    sb.close()
    se.close()
  })
})
