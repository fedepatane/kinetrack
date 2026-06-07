'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { randomUUID } from 'crypto'
import { getYoutubeEmbedUrl, resolveVideo } from '@/lib/utils'
import { fetchOgImage } from '@/lib/og'

// El renderizado deriva el reproductor de la URL (resolveVideo), así que
// video_type es solo metadato: 'youtube' cuando aplica, null para otros orígenes.
function videoTypeFor(url: string | null | undefined): 'youtube' | null {
  return url && getYoutubeEmbedUrl(url) ? 'youtube' : null
}

// Decide la miniatura a guardar:
// 1) la que cargó el kine a mano (manual), si hay;
// 2) YouTube genera la suya al renderizar → guardamos null;
// 3) para el resto (Vimeo, Drive, Loom, links externos) intentamos el og:image.
// Los archivos directos (.mp4…) no tienen página, así que quedan sin miniatura.
async function resolveThumbnail(videoUrl: string | null | undefined, manual: string | null | undefined): Promise<string | null> {
  const m = manual?.trim()
  if (m) return m
  if (!videoUrl?.trim()) return null
  const v = resolveVideo(videoUrl)
  if (!v) return null
  if (v.kind === 'image') return v.src // el link es una imagen → es su propia miniatura
  if (v.thumbnail) return null // YouTube: se deriva al renderizar
  if (v.kind === 'file') return null
  return fetchOgImage(videoUrl)
}

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  video_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  duration_seconds: z.coerce.number().optional(),
})

export async function createExercise(formData: FormData) {
  await requireAuth()

  const parsed = schema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    video_url: formData.get('video_url') || undefined,
    thumbnail_url: formData.get('thumbnail_url') || undefined,
    duration_seconds: formData.get('duration_seconds') || undefined,
  })
  if (!parsed.success) redirect('/ejercicios/nuevo')

  const categoryId = formData.get('category_id')?.toString() || null
  const thumbnail = await resolveThumbnail(parsed.data.video_url, parsed.data.thumbnail_url)

  db.prepare(`
    INSERT INTO exercises (id, name, description, video_type, video_url, thumbnail_url, duration_seconds, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    parsed.data.name,
    parsed.data.description ?? null,
    videoTypeFor(parsed.data.video_url),
    parsed.data.video_url ?? null,
    thumbnail,
    parsed.data.duration_seconds ?? null,
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
  const thumbnail = await resolveThumbnail(data.video_url, null)
  db.prepare(`
    INSERT INTO exercises (id, name, description, video_type, video_url, thumbnail_url, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name.trim(),
    data.description?.trim() || null,
    videoTypeFor(data.video_url),
    data.video_url?.trim() || null,
    thumbnail,
    data.category_id ?? null,
  )
  revalidatePath('/ejercicios')
  return db.prepare(`SELECT * FROM exercises WHERE id = ?`).get(id) as InlineExercise
}

export async function updateExercise(id: string, formData: FormData) {
  await requireAuth()

  const categoryId = formData.get('category_id')?.toString() || null

  const parsed = schema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    video_url: formData.get('video_url') || undefined,
    thumbnail_url: formData.get('thumbnail_url') || undefined,
    duration_seconds: formData.get('duration_seconds') || undefined,
  })
  if (!parsed.success) redirect(`/ejercicios/${id}/editar`)

  const thumbnail = await resolveThumbnail(parsed.data.video_url, parsed.data.thumbnail_url)

  db.prepare(`
    UPDATE exercises SET name=?, description=?, video_type=?, video_url=?,
      thumbnail_url=?, duration_seconds=?, category_id=?
    WHERE id=?
  `).run(
    parsed.data.name,
    parsed.data.description ?? null,
    videoTypeFor(parsed.data.video_url),
    parsed.data.video_url ?? null,
    thumbnail,
    parsed.data.duration_seconds ?? null,
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
