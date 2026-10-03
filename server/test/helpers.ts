import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll } from 'vitest'
import { createApp } from '../src/app.js'

export const app = createApp()
export const api = () => request(app)

export function useDatabase() {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!)
    await mongoose.connection.db!.dropDatabase()
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()))
  })
  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase()
    await mongoose.disconnect()
  })
}

let counter = 0
export interface TestUser {
  id: string
  token: string
  username: string
  auth: { Authorization: string }
}

export async function createUser(prefix = 'user'): Promise<TestUser> {
  counter += 1
  const username = `${prefix}${counter}${Math.random().toString(36).slice(2, 6)}`
  const res = await api()
    .post('/api/auth/signup')
    .send({ email: `${username}@example.com`, username, password: 'Passw0rdOk' })
    .expect(201)
  return {
    id: res.body.user.id,
    token: res.body.token,
    username,
    auth: { Authorization: `Bearer ${res.body.token}` },
  }
}
