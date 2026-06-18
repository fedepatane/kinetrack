import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Backup completo: vuelca TODAS las tablas de la base a un único JSON.
// Es genérico a propósito (recorre sqlite_master) para que el backup nunca
// quede corto si en el futuro se agregan tablas o columnas.
export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn) return new NextResponse('No autorizado', { status: 401 })

  // Consolida el WAL en el archivo principal antes de leer (snapshot consistente)
  try { db.pragma('wal_checkpoint(TRUNCATE)') } catch { /* no crítico */ }

  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all() as { name: string }[]

  const data: Record<string, unknown[]> = {}
  for (const { name } of tables) {
    data[name] = db.prepare(`SELECT * FROM "${name}"`).all()
  }

  const backup = {
    app: 'kinetrack',
    version: 1,
    exported_at: new Date().toISOString(),
    tables: data,
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="kinetrack-backup-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
