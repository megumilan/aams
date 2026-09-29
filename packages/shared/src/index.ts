export const appMetadata = {
    name: 'AAMS',
    version: '0.0.0',
} as const

export const ROLES = ['student', 'teacher', 'admin'] as const
export type Role = (typeof ROLES)[number]
