import { describe, expect, it } from 'vitest'
import { UserModel } from '../src/models/index.js'
import { purgeExpiredGuests } from '../src/modules/demo/demo.service.js'
import { api, createUser, useDatabase } from './helpers.js'

useDatabase()

async function guest() {
  const res = await api().post('/api/auth/demo').expect(201)
  return { id: res.body.user.id as string, auth: { Authorization: `Bearer ${res.body.token}` } }
}

describe('demo mode', () => {
  it('creates a populated sandbox', async () => {
    const g = await guest()
    const groups = (await api().get('/api/groups').set(g.auth)).body
    expect(groups.map((x: { name: string }) => x.name).sort()).toEqual([
      'Apollo Dev Team',
      'CS Study Circle',
      'Weekend Hackers',
    ])
    expect((await api().get('/api/groups/invites').set(g.auth)).body).toHaveLength(1)
    expect((await api().get('/api/tasks').set(g.auth)).body.length).toBeGreaterThan(5)
    expect((await api().get('/api/chats').set(g.auth)).body.length).toBe(4)
  })

  it('isolates guests from real users and from each other', async () => {
    const real = await createUser('real')
    const g1 = await guest()
    const g2 = await guest()

    // Real users can't find guests or their sandbox groups.
    expect(
      (await api().get('/api/users/search').query({ q: 'guest' }).set(real.auth)).body,
    ).toEqual([])
    expect(
      (await api().get('/api/groups/search').query({ q: 'apollo' }).set(real.auth)).body,
    ).toEqual([])

    // Guests only see the fictional seed users and their own sandbox.
    const found = (await api().get('/api/users/search').query({ q: real.username }).set(g1.auth))
      .body
    expect(found).toEqual([])
    const apollo = (await api().get('/api/groups/search').query({ q: 'apollo' }).set(g1.auth)).body
    expect(apollo).toHaveLength(1)
    expect(apollo[0].myStatus).toBe('member')

    // ...and can't DM real users or other guests.
    await api()
      .post(`/api/chats/direct/${real.id}/messages`)
      .set(g1.auth)
      .send({ text: 'spam' })
      .expect(404)
    await api()
      .post(`/api/chats/direct/${g2.id}/messages`)
      .set(g1.auth)
      .send({ text: 'spam' })
      .expect(404)
  })

  it('blocks guests from changing credentials', async () => {
    const g = await guest()
    await api().patch('/api/me').set(g.auth).send({ email: 'me@example.com' }).expect(403)
    await api()
      .put('/api/me/password')
      .set(g.auth)
      .send({ currentPassword: 'x', newPassword: 'Passw0rdOk' })
      .expect(403)
  })

  it('purges expired guests and everything in their sandbox', async () => {
    const g = await guest()
    await UserModel.updateOne({ _id: g.id }, { expiresAt: new Date(Date.now() - 1000) })
    expect(await purgeExpiredGuests()).toBeGreaterThanOrEqual(1)
    await api().get('/api/me').set(g.auth).expect(401)
    const mongoose = (await import('mongoose')).default
    const leftovers = await mongoose.connection
      .db!.collection('groups')
      .countDocuments({ demoOwner: new mongoose.Types.ObjectId(g.id) })
    expect(leftovers).toBe(0)
  })
})
