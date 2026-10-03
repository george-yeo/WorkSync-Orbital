import { describe, expect, it } from 'vitest'
import { api, createUser, useDatabase, type TestUser } from './helpers.js'

useDatabase()

let n = 0
async function createGroup(owner: TestUser, isPrivate = false) {
  n += 1
  const res = await api()
    .post('/api/groups')
    .set(owner.auth)
    .send({ name: `Team ${n} ${Date.now() % 10000}`, isPrivate })
    .expect(201)
  return res.body as { id: string; name: string; chatChannelId: string }
}

async function addMember(groupId: string, owner: TestUser, member: TestUser) {
  await api()
    .post(`/api/groups/${groupId}/invites`)
    .set(owner.auth)
    .send({ userId: member.id })
    .expect(201)
  await api().post(`/api/groups/${groupId}/invites/accept`).set(member.auth).expect(200)
}

describe('group access control', () => {
  it('only the owner can manage the group (v1 `canManage` was never awaited)', async () => {
    const owner = await createUser('owner')
    const member = await createUser('member')
    const outsider = await createUser('outsider')
    const group = await createGroup(owner)
    await addMember(group.id, owner, member)

    // A plain member is forbidden...
    await api()
      .patch(`/api/groups/${group.id}`)
      .set(member.auth)
      .send({ name: 'Hijacked' })
      .expect(403)
    await api()
      .patch(`/api/groups/${group.id}`)
      .set(member.auth)
      .send({ isPrivate: true })
      .expect(403)
    await api()
      .post(`/api/groups/${group.id}/invites`)
      .set(member.auth)
      .send({ userId: outsider.id })
      .expect(403)
    await api().delete(`/api/groups/${group.id}/members/${owner.id}`).set(member.auth).expect(403)
    await api().delete(`/api/groups/${group.id}`).set(member.auth).expect(403)
    await api()
      .post(`/api/groups/${group.id}/tasks`)
      .set(member.auth)
      .send({ title: 'x' })
      .expect(403)

    // ...and an outsider can't even see it.
    await api().get(`/api/groups/${group.id}`).set(outsider.auth).expect(404)
    await api()
      .patch(`/api/groups/${group.id}`)
      .set(outsider.auth)
      .send({ name: 'Hijacked' })
      .expect(404)
    await api().delete(`/api/groups/${group.id}`).set(outsider.auth).expect(404)

    const detail = (await api().get(`/api/groups/${group.id}`).set(owner.auth).expect(200)).body
    expect(detail.name).toBe(group.name)
  })

  it('hides invites and join requests from non-owners', async () => {
    const owner = await createUser('owner')
    const member = await createUser('member')
    const invitee = await createUser('invitee')
    const group = await createGroup(owner)
    await addMember(group.id, owner, member)
    await api()
      .post(`/api/groups/${group.id}/invites`)
      .set(owner.auth)
      .send({ userId: invitee.id })
      .expect(201)

    const asMember = (await api().get(`/api/groups/${group.id}`).set(member.auth)).body
    expect(asMember.invites).toEqual([])
    const asOwner = (await api().get(`/api/groups/${group.id}`).set(owner.auth)).body
    expect(asOwner.invites.map((u: { id: string }) => u.id)).toContain(invitee.id)
  })

  it('search results never expose member lists', async () => {
    const owner = await createUser('owner')
    const other = await createUser('other')
    const group = await createGroup(owner, true)
    const results = (
      await api()
        .get('/api/groups/search')
        .query({ q: group.name.slice(0, 6) })
        .set(other.auth)
        .expect(200)
    ).body
    const hit = results.find((g: { id: string }) => g.id === group.id)
    expect(hit).toBeDefined()
    expect(hit).not.toHaveProperty('members')
    expect(hit).not.toHaveProperty('invites')
    expect(hit.myStatus).toBe('none')
  })

  it('treats search input literally (no regex injection)', async () => {
    const u = await createUser()
    await api().get('/api/groups/search').query({ q: '(a+)+$' }).set(u.auth).expect(200)
    await api().get('/api/users/search').query({ q: '.*' }).set(u.auth).expect(200).expect([])
  })
})

describe('membership flows', () => {
  it('handles join requests for public groups and rejects them for private ones', async () => {
    const owner = await createUser('owner')
    const joiner = await createUser('joiner')
    const pub = await createGroup(owner, false)
    const priv = await createGroup(owner, true)

    await api().post(`/api/groups/${priv.id}/requests`).set(joiner.auth).expect(403)
    await api().post(`/api/groups/${pub.id}/requests`).set(joiner.auth).expect(202)
    await api()
      .post(`/api/groups/${pub.id}/requests/${joiner.id}/approve`)
      .set(owner.auth)
      .expect(200)

    const detail = (await api().get(`/api/groups/${pub.id}`).set(joiner.auth).expect(200)).body
    expect(detail.myStatus).toBe('member')
    // Joining also grants access to the group chat.
    await api().get(`/api/chats/${detail.chatChannelId}/messages`).set(joiner.auth).expect(200)
  })

  it('kicking a member removes their group tasks and chat access', async () => {
    const owner = await createUser('owner')
    const member = await createUser('member')
    const group = await createGroup(owner)
    await addMember(group.id, owner, member)
    await api()
      .post(`/api/groups/${group.id}/tasks`)
      .set(owner.auth)
      .send({ title: 'Everyone do this' })
      .expect(201)
    expect((await api().get('/api/tasks').set(member.auth)).body).toHaveLength(1)

    await api().delete(`/api/groups/${group.id}/members/${member.id}`).set(owner.auth).expect(200)
    expect((await api().get('/api/tasks').set(member.auth)).body).toHaveLength(0)
    await api().get(`/api/chats/${group.chatChannelId}/messages`).set(member.auth).expect(404)
  })

  it('owners cannot leave; members can', async () => {
    const owner = await createUser('owner')
    const member = await createUser('member')
    const group = await createGroup(owner)
    await addMember(group.id, owner, member)
    await api().post(`/api/groups/${group.id}/leave`).set(owner.auth).expect(400)
    await api().post(`/api/groups/${group.id}/leave`).set(member.auth).expect(204)
  })
})

describe('SyncTree', () => {
  it('grows by completing group tasks and counts a tree at 100%', async () => {
    const owner = await createUser('owner')
    const group = await createGroup(owner)
    await api().post(`/api/groups/${group.id}/tree`).set(owner.auth).expect(200)
    await api().post(`/api/groups/${group.id}/tree`).set(owner.auth).expect(409)

    const ids: string[] = []
    for (let i = 0; i < 10; i++) {
      const t = await api()
        .post('/api/tasks')
        .set(owner.auth)
        .send({ title: `t${i}`, groupId: group.id })
        .expect(201)
      ids.push(t.body.id)
    }
    await api().patch(`/api/tasks/${ids[0]}`).set(owner.auth).send({ completed: true }).expect(200)
    let g = (await api().get(`/api/groups/${group.id}`).set(owner.auth)).body
    expect(g.tree).toEqual({ isGrowing: true, progress: 10, grown: 0 })

    // Un-completing takes the progress back (no farming by toggling).
    await api().patch(`/api/tasks/${ids[0]}`).set(owner.auth).send({ completed: false }).expect(200)
    g = (await api().get(`/api/groups/${group.id}`).set(owner.auth)).body
    expect(g.tree.progress).toBe(0)

    for (const id of ids)
      await api().patch(`/api/tasks/${id}`).set(owner.auth).send({ completed: true })
    g = (await api().get(`/api/groups/${group.id}`).set(owner.auth)).body
    expect(g.tree).toEqual({ isGrowing: false, progress: 100, grown: 1 })
  })
})
