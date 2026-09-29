import { ROLES } from '@aams/shared'
import { sql } from 'drizzle-orm'
import {
    boolean,
    datetime,
    index,
    int,
    mysqlEnum,
    mysqlTable,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/mysql-core'

export const USER_STATUSES = ['active', 'disabled'] as const

export const users = mysqlTable(
    'users',
    {
        id: int('id', { unsigned: true }).primaryKey().autoincrement(),
        username: varchar('username', { length: 32 }).notNull(),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        name: varchar('name', { length: 64 }).notNull(),
        email: varchar('email', { length: 128 }),
        phone: varchar('phone', { length: 20 }),
        role: mysqlEnum('role', ROLES).notNull(),
        status: mysqlEnum('status', USER_STATUSES).notNull().default('active'),
        mustChangePassword: boolean('must_change_password')
            .notNull()
            .default(false),
        failedLoginCount: int('failed_login_count').notNull().default(0),
        lockedUntil: datetime('locked_until'),
        lastLoginAt: datetime('last_login_at'),
        deletedAt: datetime('deleted_at'),
        createdAt: datetime('created_at')
            .notNull()
            .default(sql`current_timestamp`),
        updatedAt: datetime('updated_at')
            .notNull()
            .default(sql`current_timestamp`)
            .$onUpdate(() => new Date()),
    },
    (t) => [
        uniqueIndex('users_username_unique').on(t.username),
        uniqueIndex('users_email_unique').on(t.email),
        index('users_role_status_idx').on(t.role, t.status),
    ],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserStatus = (typeof USER_STATUSES)[number]
