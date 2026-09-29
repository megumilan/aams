import 'dotenv/config'

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { createPool } from 'mysql2/promise'

import * as schema from './schema.ts'

const pool = createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: 'Z',
    charset: 'utf8mb4_general_ci',
})

export const db = drizzle(pool, { schema, mode: 'default' })

export async function pingDatabase(): Promise<void> {
    await db.execute(sql`select 1`)
}

export async function closeDatabase(): Promise<void> {
    await pool.end()
}
