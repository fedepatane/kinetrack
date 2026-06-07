import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

// Clave/valor simple para configuración de la app (ej. contraseña personalizada).
export function getSetting(key: string): string | null {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string) {
  db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value)
}

// ── Contraseña ──────────────────────────────────────────────────────────────
// Se guarda hasheada (scrypt + salt). Si no hay ninguna guardada, se usa la de
// la variable de entorno KINE_PASSWORD como valor por defecto.

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf)
}

// Verifica una contraseña contra la guardada (o, si no hay, contra la env var).
export function checkPassword(password: string): boolean {
  const stored = getSetting('password_hash')
  if (stored) return verifyPassword(password, stored)
  return password === (process.env.KINE_PASSWORD ?? 'kine1234')
}

export function savePassword(password: string) {
  setSetting('password_hash', hashPassword(password))
}
