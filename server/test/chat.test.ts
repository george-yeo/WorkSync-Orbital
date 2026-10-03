import { describe, expect, it } from 'vitest'
import { api, createUser, useDatabase } from './helpers.js'

useDatabase()

describe('chat', () => {
  it('creates a DM on first message and lists it for both sides', async () => {
    const a = await createUser('alice')
    const b = await createUser('bob')
    const sent = await api()
      .post(`/api/chats/direct/${b.id}/messages`)
      .set(a.auth)
      .send({ text: 'hi bob' })
      .expect(201)
    expect(sent.body.channel.peer.id).toBe(b.id)
    expect(sent.body.message.text).toBe('hi bob')

    const bobChats = (await api().get('/api/chats').set(b.auth).expect(200)).body
    expect(bobChats[0]).toMatchObject({
      type: 'direct',
      name: a.username,
      lastMessage: { text: 'hi bob' },
    })

    // Second message reuses the same channel.
    const again = await api()
      .post(`/api/chats/direct/${b.id}/messages`)
      .set(a.auth)
      .send({ text: 'again' })
      .expect(201)
    expect(again.body.channel.id).toBe(sent.body.channel.id)
  })

  it("prevents reading or posting to channels you're not in", async () => {
    const a = await createUser('alice')
    const b = await createUser('bob')
    const eve = await createUser('eve')
    const { body } = await api()
      .post(`/api/chats/direct/${b.id}/messages`)
      .set(a.auth)
      .send({ text: 'secret' })
    await api().get(`/api/chats/${body.channel.id}/messages`).set(eve.auth).expect(404)
    await api()
      .post(`/api/chats/${body.channel.id}/messages`)
      .set(eve.auth)
      .send({ text: 'hi' })
      .expect(404)
  })

  it('paginates messages newest-first with a cursor', async () => {
    const a = await createUser('alice')
    const b = await createUser('bob')
    const first = await api()
      .post(`/api/chats/direct/${b.id}/messages`)
      .set(a.auth)
      .send({ text: 'm0' })
    const channelId = first.body.channel.id
    for (let i = 1; i < 5; i++) {
      await api()
        .post(`/api/chats/${channelId}/messages`)
        .set(a.auth)
        .send({ text: `m${i}` })
      await new Promise((r) => setTimeout(r, 5))
    }
    const page1 = (
      await api().get(`/api/chats/${channelId}/messages`).query({ limit: 2 }).set(b.auth)
    ).body
    expect(page1.messages.map((m: { text: string }) => m.text)).toEqual(['m3', 'm4'])
    expect(page1.hasMore).toBe(true)
    const page2 = (
      await api()
        .get(`/api/chats/${channelId}/messages`)
        .query({ limit: 2, before: page1.messages[0].createdAt })
        .set(b.auth)
    ).body
    expect(page2.messages.map((m: { text: string }) => m.text)).toEqual(['m1', 'm2'])
  })
})
