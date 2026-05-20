import { db } from '@/lib/db'
import type { Category } from '@/lib/db/types'

export type CategoryWithSubs = Category & { subcategories: Category[] }

export function getCategories(): CategoryWithSubs[] {
  const all = db.prepare(`SELECT * FROM categories ORDER BY order_index, name`).all() as Category[]
  const top = all.filter(c => c.parent_id === null)
  return top.map(cat => ({
    ...cat,
    subcategories: all.filter(c => c.parent_id === cat.id),
  }))
}

export function getCategoriesFlat(): Category[] {
  return db.prepare(`SELECT * FROM categories ORDER BY order_index, name`).all() as Category[]
}
