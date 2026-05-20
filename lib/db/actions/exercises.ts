'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { randomUUID } from 'crypto'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  video_url: z.string().optional(),
  duration_seconds: z.coerce.number().optional(),
  tags: z.string().optional(),
})

export async function createExercise(formData: FormData) {
  await requireAuth()

  const parsed = schema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    video_url: formData.get('video_url') || undefined,
    duration_seconds: formData.get('duration_seconds') || undefined,
    tags: formData.get('tags') || undefined,
  })
  if (!parsed.success) redirect('/ejercicios/nuevo')

  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []
  const categoryId = formData.get('category_id')?.toString() || null

  db.prepare(`
    INSERT INTO exercises (id, name, description, video_type, video_url, duration_seconds, tags, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    parsed.data.name,
    parsed.data.description ?? null,
    parsed.data.video_url ? 'youtube' : null,
    parsed.data.video_url ?? null,
    parsed.data.duration_seconds ?? null,
    JSON.stringify(tags),
    categoryId,
  )

  revalidatePath('/ejercicios')
  redirect('/ejercicios')
}

export type InlineExercise = {
  id: string; name: string; description: string | null
  video_url: string | null; video_type: string | null
  tags: string[]; category_id: string | null
  thumbnail_url: string | null; duration_seconds: number | null; created_at: string
}

export async function createExerciseInline(data: {
  name: string; description?: string; video_url?: string; category_id?: string | null
}): Promise<InlineExercise> {
  await requireAuth()
  const id = randomUUID()
  db.prepare(`
    INSERT INTO exercises (id, name, description, video_type, video_url, tags, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name.trim(),
    data.description?.trim() || null,
    data.video_url ? 'youtube' : null,
    data.video_url?.trim() || null,
    '[]',
    data.category_id ?? null,
  )
  revalidatePath('/ejercicios')
  return db.prepare(`SELECT * FROM exercises WHERE id = ?`).get(id) as InlineExercise
}

export async function updateExercise(id: string, formData: FormData) {
  await requireAuth()

  const tagsRaw = formData.get('tags')?.toString() ?? ''
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
  const categoryId = formData.get('category_id')?.toString() || null

  const parsed = schema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    video_url: formData.get('video_url') || undefined,
    duration_seconds: formData.get('duration_seconds') || undefined,
  })
  if (!parsed.success) redirect(`/ejercicios/${id}/editar`)

  db.prepare(`
    UPDATE exercises SET name=?, description=?, video_type=?, video_url=?,
      duration_seconds=?, tags=?, category_id=?
    WHERE id=?
  `).run(
    parsed.data.name,
    parsed.data.description ?? null,
    parsed.data.video_url ? 'youtube' : null,
    parsed.data.video_url ?? null,
    parsed.data.duration_seconds ?? null,
    JSON.stringify(tags),
    categoryId,
    id,
  )

  revalidatePath('/ejercicios')
  redirect(`/ejercicios`)
}

export async function deleteExercise(id: string) {
  await requireAuth()
  db.prepare(`DELETE FROM exercises WHERE id = ?`).run(id)
  revalidatePath('/ejercicios')
}
