import { randomBytes, createHash } from 'node:crypto'

const API_KEY_BYTES = 32

export function generateApiKey(): string {
  return randomBytes(API_KEY_BYTES).toString('hex')
}

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}
