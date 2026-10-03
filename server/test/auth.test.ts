import { describe, expect, it } from 'vitest'
import { api, createUser, useDatabase } from './helpers.js'

useDatabase()

describe('auth', () => {
  it('signs up and returns a token plus a private profile without secrets', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ email: 'Alice@Example.com', username: 'alice_1', password: 'Passw0rdOk' })
      .expect(201)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.user).toMatchObject({
      email: 'alice@example.com',
      username: 'alice_1',
      isGuest: false,
    })
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|scrypt/)
  })

  it('validates input with field-level errors', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ email: 'nope', username: 'a', password: 'short' })
      .expect(400)
    expect(res.body.details.fields).toHaveProperty('email')
    expect(res.body.details.fields).toHaveProperty('username')
    expect(res.body.details.fields).toHaveProperty('password')
  })

  it('rejects duplicate emails and case-insensitive duplicate usernames', async () => {
    await api()
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', username: 'dupname', password: 'Passw0rdOk' })
      .expect(201)
    await api()
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', username: 'other', password: 'Passw0rdOk' })
      .expect(409)
    await api()
      .post('/api/auth/signup')
      .send({ email: 'x@example.com', username: 'DUPNAME', password: 'Passw0rdOk' })
      .expect(409)
  })

  it('uses one generic message for unknown email and wrong password', async () => {
    await api()
      .post('/api/auth/signup')
      .send({ email: 'bob@example.com', username: 'bobby', password: 'Passw0rdOk' })
    const wrongPw = await api()
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'nope' })
      .expect(401)
    const noUser = await api()
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'nope' })
      .expect(401)
    expect(wrongPw.body.error).toBe(noUser.body.error)
    await api()
      .post('/api/auth/login')
      .send({ email: 'BOB@example.com', password: 'Passw0rdOk' })
      .expect(200)
  })

  it('rejects missing, forged and orphaned tokens', async () => {
    await api().get('/api/me').expect(401)
    await api().get('/api/me').set('Authorization', 'Bearer not.a.jwt').expect(401)
    const u = await createUser()
    await api().delete('/api/me').set(u.auth).send({ password: 'Passw0rdOk' }).expect(204)
    await api().get('/api/me').set(u.auth).expect(401)
  })
})

describe('profile', () => {
  it('only lets you edit yourself, and requires the current password to change it', async () => {
    const u = await createUser()
    const res = await api()
      .patch('/api/me')
      .set(u.auth)
      .send({ displayName: 'New Name' })
      .expect(200)
    expect(res.body.displayName).toBe('New Name')

    await api()
      .put('/api/me/password')
      .set(u.auth)
      .send({ currentPassword: 'wrong', newPassword: 'N3wPassword' })
      .expect(400)
    await api()
      .put('/api/me/password')
      .set(u.auth)
      .send({ currentPassword: 'Passw0rdOk', newPassword: 'N3wPassword' })
      .expect(204)
  })

  it('rejects uploads that are not real images', async () => {
    const u = await createUser()
    await api()
      .put('/api/me/avatar')
      .set(u.auth)
      .attach('avatar', Buffer.from('<?php echo 1; ?>'), {
        filename: 'x.png',
        contentType: 'image/png',
      })
      .expect(400)
  })
})

describe('robustness', () => {
  it('returns 400 for malformed ids instead of crashing the process', async () => {
    const u = await createUser()
    await api().get('/api/users/not-an-id/avatar').expect(400)
    await api().patch('/api/tasks/123').set(u.auth).send({ title: 'x' }).expect(400)
    await api().get('/api/groups/zzz').set(u.auth).expect(400)
    await api().get('/api/health').expect(200)
  })

  it('returns JSON 404s for unknown routes and 400 for malformed JSON', async () => {
    await api().get('/api/nope').expect(404)
    await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad')
      .expect(400)
  })
})
