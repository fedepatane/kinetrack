import { db } from '@/lib/db'
import type { Exercise, Category } from '@/lib/db/types'

export type ExerciseWithCategory = Exercise & {
  category_id: string | null
  category: Category | null
  parent_category: Category | null
}

function parseExercise(row: Record<string, unknown>): ExerciseWithCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    video_type: row.video_type as Exercise['video_type'],
    video_url: row.video_url as string | null,
    thumbnail_url: row.thumbnail_url as string | null,
    duration_seconds: row.duration_seconds as number | null,
    tags: JSON.parse((row.tags as string) || '[]'),
    created_at: row.created_at as string,
    category_id: row.category_id as string | null,
    category: row.cat_id ? {
      id: row.cat_id as string,
      name: row.cat_name as string,
      parent_id: row.cat_parent as string | null,
      order_index: row.cat_order as number,
    } : null,
    parent_category: row.pcat_id ? {
      id: row.pcat_id as string,
      name: row.pcat_name as string,
      parent_id: null,
      order_index: row.pcat_order as number,
    } : null,
  }
}

const SELECT = `
  SELECT e.*,
    c.id as cat_id, c.name as cat_name, c.parent_id as cat_parent, c.order_index as cat_order,
    p.id as pcat_id, p.name as pcat_name, p.order_index as pcat_order
  FROM exercises e
  LEFT JOIN categories c ON c.id = e.category_id
  LEFT JOIN categories p ON p.id = c.parent_id
`

export function getExercises(opts?: { q?: string; cat?: string; sub?: string }): ExerciseWithCategory[] {
  const conditions: string[] = []
  const args: unknown[] = []

  if (opts?.q) {
    conditions.push(`(e.name LIKE ? OR e.description LIKE ?)`)
    args.push(`%${opts.q}%`, `%${opts.q}%`)
  }
  if (opts?.sub) {
    // subcategoría específica
    conditions.push(`e.category_id = ?`)
    args.push(opts.sub)
  } else if (opts?.cat) {
    // categoría padre: incluye la categoría y todas sus subcategorías
    conditions.push(`(e.category_id = ? OR c.parent_id = ?)`)
    args.push(opts.cat, opts.cat)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(`${SELECT} ${where} ORDER BY e.name`).all(...args) as Record<string, unknown>[]
  return rows.map(parseExercise)
}

export function getExercise(id: string): ExerciseWithCategory | null {
  const row = db.prepare(`${SELECT} WHERE e.id = ?`).get(id) as Record<string, unknown> | null
  return row ? parseExercise(row) : null
}
