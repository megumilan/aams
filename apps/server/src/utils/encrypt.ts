import { hash, verify } from 'argon2'

export function hashPassword(password: string) {
    return hash(password)
}

export function verifyPassword(hashed: string, password: string) {
    return verify(hashed, password)
}
