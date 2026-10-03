import { describe, expect, it } from 'vitest'
import { api, createUser, useDatabase } from './helpers.js'

useDatabase()

describe('lists and tasks', () => {
  it('supports the full CRUD lifecycle', async () => {
    const u = await createUser()
    const list = (await api().post('/api/lists').set(u.auth).send({ title: 'Inbox' }).expect(201))
      .body
    const task = (
      await api()
        .post('/api/tasks')
        .set(u.auth)
        .send({ title: 'Write tests', listId: list.id, deadline: '2030-01-01' })
        .expect(201)
    ).body
    expect(task).toMatchObject({ title: 'Write tests', listId: list.id, completedAt: null })

    const done = (
      await api().patch(`/api/tasks/${task.id}`).set(u.auth).send({ completed: true }).expect(200)
    ).body
    expect(done.completedAt).not.toBeNull()

    await api().delete(`/api/lists/${list.id}`).set(u.auth).expect(204)
    const remaining = (await api().get('/api/tasks').set(u.auth).expect(200)).body
    expect(remaining).toHaveLength(0)
  })

  it("prevents reading or changing another user's tasks and lists (v1 IDOR)", async () => {
    const alice = await createUser('alice')
    const mallory = await createUser('mallory')
    const list = (
      await api().post('/api/lists').set(alice.auth).send({ title: 'Private' }).expect(201)
    ).body
    const task = (
      await api()
        .post('/api/tasks')
        .set(alice.auth)
        .send({ title: 'Secret', listId: list.id })
        .expect(201)
    ).body

    await api()
      .patch(`/api/tasks/${task.id}`)
      .set(mallory.auth)
      .send({ title: 'pwned' })
      .expect(404)
    await api().delete(`/api/tasks/${task.id}`).set(mallory.auth).expect(404)
    await api()
      .patch(`/api/lists/${list.id}`)
      .set(mallory.auth)
      .send({ title: 'pwned' })
      .expect(404)
    await api().delete(`/api/lists/${list.id}`).set(mallory.auth).expect(404)
    // Can't create tasks inside someone else's list either.
    await api()
      .post('/api/tasks')
      .set(mallory.auth)
      .send({ title: 'x', listId: list.id })
      .expect(404)
    expect((await api().get('/api/tasks').set(mallory.auth)).body).toHaveLength(0)
  })

  it('rejects mass-assignment of fields like owner (v1 spread req.body into updates)', async () => {
    const alice = await createUser('alice')
    const bob = await createUser('bob')
    const list = (await api().post('/api/lists').set(alice.auth).send({ title: 'L' })).body
    const task = (
      await api().post('/api/tasks').set(alice.auth).send({ title: 'T', listId: list.id })
    ).body
    await api().patch(`/api/tasks/${task.id}`).set(alice.auth).send({ owner: bob.id }).expect(400)
  })

  it('requires exactly one of listId or groupId', async () => {
    const u = await createUser()
    await api().post('/api/tasks').set(u.auth).send({ title: 'orphan' }).expect(400)
  })
})
