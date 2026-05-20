'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { randomUUID } from 'crypto'

const blockExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  order_index: z.coerce.number(),
  sets: z.coerce.number().optional(),
  reps: z.coerce.number().optional(),
  duration_seconds: z.coerce.number().optional(),
  rest_seconds: z.coerce.number().optional(),
  intensity_type: z.enum(['rpe', 'rir', '1rm']).optional(),
  intensity_value: z.coerce.number().optional(),
  notes: z.string().optional(),
})

const blockSchema = z.object({
  name: z.string().min(1),
  order_index: z.coerce.number(),
  notes: z.string().optional(),
  exercises: z.array(blockExerciseSchema).default([]),
})

const daySchema = z.object({
  name: z.string().min(1),
  order_index: z.coerce.number(),
  blocks: z.array(blockSchema).default([]),
})

const routineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  body_zone: z.string().optional(),
  difficulty: z.enum(['suave', 'moderado', 'intenso']).optional(),
  estimated_minutes: z.coerce.number().optional(),
  days: z.array(daySchema).default([]),    // días con sus bloques
  blocks: z.array(blockSchema).default([]), // bloques sin día (rutina simple)
})

function insertBlocks(blocks: z.infer<typeof blockSchema>[], routineId: string, dayId: string | null) {
  for (const block of blocks) {
    const blockId = randomUUID()
    db.prepare(`
      INSERT INTO blocks (id, routine_id, name, order_index, notes, day_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(blockId, routineId, block.name, block.order_index, block.notes ?? null, dayId)

    for (const be of block.exercises) {
      db.prepare(`
        INSERT INTO block_exercises (id, block_id, exercise_id, order_index, sets, reps, duration_seconds, rest_seconds, intensity_type, intensity_value, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(), blockId, be.exercise_id, be.order_index,
        be.sets ?? null, be.reps ?? null, be.duration_seconds ?? null,
        be.rest_seconds ?? null, be.intensity_type ?? null, be.intensity_value ?? null,
        be.notes ?? null,
      )
    }
  }
}

export async function createRoutine(payload: unknown): Promise<{ error?: string }> {
  await requireAuth()
  const parsed = routineSchema.safeParse(payload)
  if (!parsed.success) return { error: 'Datos inválidos' }

  const { days, blocks, ...routineData } = parsed.data
  const routineId = randomUUID()

  const insert = db.transaction(() => {
    db.prepare(`
      INSERT INTO routines (id, name, description, body_zone, difficulty, estimated_minutes, public_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      routineId, routineData.name, routineData.description ?? null,
      routineData.body_zone ?? null, routineData.difficulty ?? null,
      routineData.estimated_minutes ?? null, randomUUID().replace(/-/g, ''),
    )

    // Días
    for (const day of days) {
      const dayId = randomUUID()
      db.prepare(`INSERT INTO routine_days (id, routine_id, name, order_index) VALUES (?, ?, ?, ?)`)
        .run(dayId, routineId, day.name, day.order_index)
      insertBlocks(day.blocks, routineId, dayId)
    }

    // Bloques sin día (rutina simple)
    insertBlocks(blocks, routineId, null)
  })

  insert()
  revalidatePath('/rutinas')
  redirect(`/rutinas/${routineId}`)
}

export async function updateRoutine(id: string, payload: unknown): Promise<{ error?: string }> {
  await requireAuth()
  const parsed = routineSchema.safeParse(payload)
  if (!parsed.success) return { error: 'Datos inválidos' }

  const { days, blocks, ...routineData } = parsed.data

  const update = db.transaction(() => {
    db.prepare(`
      UPDATE routines SET name=?, description=?, body_zone=?, difficulty=?, estimated_minutes=?
      WHERE id=?
    `).run(
      routineData.name, routineData.description ?? null,
      routineData.body_zone ?? null, routineData.difficulty ?? null,
      routineData.estimated_minutes ?? null, id,
    )

    // Borrar días y bloques anteriores (cascade borra block_exercises)
    db.prepare(`DELETE FROM routine_days WHERE routine_id=?`).run(id)
    db.prepare(`DELETE FROM blocks WHERE routine_id=?`).run(id)

    for (const day of days) {
      const dayId = randomUUID()
      db.prepare(`INSERT INTO routine_days (id, routine_id, name, order_index) VALUES (?, ?, ?, ?)`)
        .run(dayId, id, day.name, day.order_index)
      insertBlocks(day.blocks, id, dayId)
    }
    insertBlocks(blocks, id, null)
  })

  update()
  revalidatePath('/rutinas')
  revalidatePath(`/rutinas/${id}`)
  redirect(`/rutinas/${id}`)
}

export async function deleteRoutine(id: string) {
  await requireAuth()
  db.prepare(`DELETE FROM routines WHERE id = ?`).run(id)
  revalidatePath('/rutinas')
  redirect('/rutinas')
}

export async function duplicateRoutine(id: string) {
  await requireAuth()

  const original = db.prepare(`SELECT * FROM routines WHERE id = ?`).get(id) as { name: string; description: string | null; body_zone: string | null; difficulty: string | null; estimated_minutes: number | null } | null
  if (!original) return

  const newId = randomUUID()
  const newToken = randomUUID().replace(/-/g, '')

  const dupe = db.transaction(() => {
    db.prepare(`
      INSERT INTO routines (id, name, description, body_zone, difficulty, estimated_minutes, public_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newId, `${original.name} (copia)`, original.description, original.body_zone, original.difficulty, original.estimated_minutes, newToken)

    // Copiar días
    const days = db.prepare(`SELECT * FROM routine_days WHERE routine_id = ? ORDER BY order_index`).all(id) as { id: string; name: string; order_index: number }[]
    for (const day of days) {
      const newDayId = randomUUID()
      db.prepare(`INSERT INTO routine_days (id, routine_id, name, order_index) VALUES (?, ?, ?, ?)`)
        .run(newDayId, newId, day.name, day.order_index)
      copyBlocks(day.id, 'day_id', newId, newDayId)
    }

    // Copiar bloques sin día
    copyBlocks(id, 'routine_id', newId, null)
  })

  dupe()
  revalidatePath('/rutinas')
  redirect(`/rutinas/${newId}/editar`)
}

function copyBlocks(parentId: string, field: 'day_id' | 'routine_id', newRoutineId: string, newDayId: string | null) {
  const blocks = field === 'day_id'
    ? db.prepare(`SELECT * FROM blocks WHERE day_id = ? ORDER BY order_index`).all(parentId) as { id: string; name: string; order_index: number; notes: string | null }[]
    : db.prepare(`SELECT * FROM blocks WHERE routine_id = ? AND day_id IS NULL ORDER BY order_index`).all(parentId) as { id: string; name: string; order_index: number; notes: string | null }[]

  for (const block of blocks) {
    const newBlockId = randomUUID()
    db.prepare(`INSERT INTO blocks (id, routine_id, name, order_index, notes, day_id) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(newBlockId, newRoutineId, block.name, block.order_index, block.notes, newDayId)

    const bes = db.prepare(`SELECT * FROM block_exercises WHERE block_id = ? ORDER BY order_index`).all(block.id) as { exercise_id: string; order_index: number; sets: number | null; reps: number | null; duration_seconds: number | null; rest_seconds: number | null; notes: string | null }[]
    for (const be of bes) {
      db.prepare(`INSERT INTO block_exercises (id, block_id, exercise_id, order_index, sets, reps, duration_seconds, rest_seconds, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(randomUUID(), newBlockId, be.exercise_id, be.order_index, be.sets, be.reps, be.duration_seconds, be.rest_seconds, be.notes)
    }
  }
}
