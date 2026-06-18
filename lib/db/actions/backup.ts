'use server'

import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

type RestoreResult = { error?: string; ok?: boolean; summary?: string }

// Restaura un backup JSON generado por /api/backup.
// mode = 'replace' → borra todo y carga el backup.
// mode = 'merge'   → agrega lo que no exista (por clave primaria), sin pisar lo actual.
export async function restoreBackup(
  _prev: RestoreResult | null,
  formData: FormData,
): Promise<RestoreResult> {
  await requireAuth()

  const file = formData.get('file')
  const mode = formData.get('mode')?.toString()

  if (!(file instanceof File) || file.size === 0) return { error: 'Elegí un archivo de backup.' }
  if (mode !== 'replace' && mode !== 'merge') return { error: 'Elegí cómo querés restaurar.' }

  let backup: { app?: string; tables?: Record<string, unknown[]> }
  try {
    backup = JSON.parse(await file.text())
  } catch {
    return { error: 'El archivo no es un JSON válido.' }
  }
  if (!backup || backup.app !== 'kinetrack' || !backup.tables || typeof backup.tables !== 'object') {
    return { error: 'El archivo no parece un backup de KineTrack.' }
  }

  // Solo tablas que existen realmente en la base (whitelist contra inyección)
  const realTables = new Set(
    (db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all() as { name: string }[])
      .map(t => t.name),
  )
  const tableNames = Object.keys(backup.tables).filter(t => realTables.has(t))
  if (tableNames.length === 0) return { error: 'El backup no contiene datos reconocibles.' }

  let inserted = 0

  // FK off para poder borrar/insertar en cualquier orden; debe setearse fuera de la transacción.
  db.pragma('foreign_keys = OFF')
  try {
    const run = db.transaction(() => {
      if (mode === 'replace') {
        for (const t of tableNames) db.prepare(`DELETE FROM "${t}"`).run()
      }
      for (const t of tableNames) {
        const rows = backup.tables![t]
        if (!Array.isArray(rows) || rows.length === 0) continue
        const realCols = new Set(
          (db.prepare(`PRAGMA table_info("${t}")`).all() as { name: string }[]).map(c => c.name),
        )
        const cols = Object.keys(rows[0] as object).filter(c => realCols.has(c))
        if (cols.length === 0) continue
        const verb = mode === 'replace' ? 'INSERT' : 'INSERT OR IGNORE'
        const stmt = db.prepare(
          `${verb} INTO "${t}" (${cols.map(c => `"${c}"`).join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        )
        for (const row of rows as Record<string, unknown>[]) {
          const values = cols.map(c => (row[c] === undefined ? null : row[c]) as string | number | bigint | null)
          inserted += stmt.run(...values).changes
        }
      }
    })
    run()
  } catch (e) {
    return { error: 'No se pudo restaurar: ' + (e instanceof Error ? e.message : 'error desconocido') }
  } finally {
    db.pragma('foreign_keys = ON')
  }

  for (const p of ['/dashboard', '/pacientes', '/ejercicios', '/rutinas', '/categorias']) revalidatePath(p)

  const verb = mode === 'replace' ? 'Se reemplazaron los datos' : 'Se agregaron los datos faltantes'
  return { ok: true, summary: `${verb}. ${inserted} registros cargados.` }
}
