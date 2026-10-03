import { inject } from 'vitest'

const base = inject('mongoUri')
// Unique database per test file so files never see each other's data.
const dbName = `worksync_test_${Math.random().toString(36).slice(2, 10)}`
const url = new URL(base)
url.pathname = `/${dbName}`

process.env.NODE_ENV = 'test'
process.env.MONGO_URI = url.toString()
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.DEMO_ENABLED = 'true'
