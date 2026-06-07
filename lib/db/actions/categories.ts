'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { randomUUID } from 'crypto'

export async function createCategory(name: string, parentId: string | null = null) {
  await requireAuth()
  const maxOrder = (db.prepare(
    `SELECT COALESCE(MAX(order_index), -1) as m FROM categories WHERE parent_id IS ?`
  ).get(parentId) as { m: number }).m
  db.prepare(
    `INSERT INTO categories (id, name, parent_id, order_index) VALUES (?, ?, ?, ?)`
  ).run(randomUUID(), name.trim(), parentId, maxOrder + 1)
  revalidatePath('/categorias')
  revalidatePath('/ejercicios')
}

export async function setCategoryColor(id: string, color: string | null) {
  await requireAuth()
  db.prepare(`UPDATE categories SET color = ? WHERE id = ?`).run(color, id)
  revalidatePath('/categorias')
  revalidatePath('/ejercicios')
  revalidatePath('/rutinas')
}

export async function renameCategory(id: string, name: string) {
  await requireAuth()
  db.prepare(`UPDATE categories SET name = ? WHERE id = ?`).run(name.trim(), id)
  revalidatePath('/categorias')
  revalidatePath('/ejercicios')
}

// Persiste un nuevo orden para un conjunto de categorías hermanas (mismo padre).
// Asigna order_index según la posición en el array recibido.
export async function reorderCategories(orderedIds: string[]) {
  await requireAuth()
  if (orderedIds.length === 0) return
  const upd = db.prepare(`UPDATE categories SET order_index = ? WHERE id = ?`)
  const reorder = db.transaction(() => orderedIds.forEach((id, i) => upd.run(i, id)))
  reorder()
  revalidatePath('/categorias')
  revalidatePath('/ejercicios')
}

export async function deleteCategory(id: string) {
  await requireAuth()
  // Los ejercicios quedan con category_id = NULL (ON DELETE SET NULL)
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id)
  revalidatePath('/categorias')
  revalidatePath('/ejercicios')
}

export async function assignCategory(exerciseId: string, categoryId: string | null) {
  await requireAuth()
  db.prepare(`UPDATE exercises SET category_id = ? WHERE id = ?`).run(categoryId, exerciseId)
  revalidatePath('/ejercicios')
  revalidatePath('/categorias')
}
