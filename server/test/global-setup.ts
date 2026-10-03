import type { TestProject } from 'vitest/node'

/**
 * Uses MONGO_URI_TEST if provided (e.g. a CI service container), otherwise starts an in-memory
 * MongoDB replica via mongodb-memory-server.
 */
export default async function setup(project: TestProject) {
  if (process.env.MONGO_URI_TEST) {
    project.provide('mongoUri', process.env.MONGO_URI_TEST)
    return
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongod = await MongoMemoryServer.create()
  project.provide('mongoUri', mongod.getUri())
  return async () => {
    await mongod.stop()
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string
  }
}
