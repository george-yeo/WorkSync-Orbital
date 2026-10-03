/**
 * Creates the fictional demo users. Group sandboxes are created per visitor when they click
 * "Try the demo", so there is nothing else to seed. Run with: npm run seed
 */
import { env } from '../config/env.js'
import { connectDatabase, disconnectDatabase } from '../db/connect.js'
import { logger } from '../lib/logger.js'
import { ensureSeedUsers } from '../modules/demo/demo.service.js'

await connectDatabase(env.MONGO_URI)
const ids = await ensureSeedUsers()
logger.info(`Seed users ready: ${[...ids.keys()].join(', ')}`)
await disconnectDatabase()
