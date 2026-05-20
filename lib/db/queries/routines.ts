import { db } from '@/lib/db'
import type { Routine, Block, BlockExercise, Exercise, RoutineDay } from '@/lib/db/types'

export function getRoutines(opts?: { q?: string; difficulty?: string; bodyZone?: string }): Routine[] {
  const conditions: string[] = []
  const args: unknown[] = []

  if (opts?.q) {
    conditions.push(`(name LIKE ? OR description LIKE ? OR body_zone LIKE ?)`)
    args.push(`%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`)
  }
  if (opts?.difficulty) {
    conditions.push(`difficulty = ?`)
    args.push(opts.difficulty)
  }
  if (opts?.bodyZone) {
    conditions.push(`body_zone LIKE ?`)
    args.push(`%${opts.bodyZone}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return db.prepare(`SELECT * FROM routines ${where} ORDER BY name`).all(...args) as Routine[]
}

export type BlockExerciseWithExercise = BlockExercise & { exercise: Exercise | null }
export type BlockWithExercises = Block & { block_exercises: BlockExerciseWithExercise[] }
export type DayWithBlocks = RoutineDay & { blocks: BlockWithExercises[] }
export type RoutineWithBlocks = Routine & {
  days: DayWithBlocks[]
  blocks: BlockWithExercises[] // bloques sin día asignado
}

function fetchBlocksForParent(parentId: string, field: 'day_id' | 'routine_id_no_day'): BlockWithExercises[] {
  const blocks = field === 'day_id'
    ? db.prepare(`SELECT * FROM blocks WHERE day_id = ? ORDER BY order_index`).all(parentId) as Block[]
    : db.prepare(`SELECT * FROM blocks WHERE routine_id = ? AND day_id IS NULL ORDER BY order_index`).all(parentId) as Block[]

  return blocks.map(block => {
    const rows = db.prepare(`
      SELECT be.*, e.name as e_name, e.description as e_desc,
             e.video_type as e_vtype, e.video_url as e_vurl,
             e.thumbnail_url as e_thumb, e.duration_seconds as e_dur, e.tags as e_tags
      FROM block_exercises be
      LEFT JOIN exercises e ON e.id = be.exercise_id
      WHERE be.block_id = ?
      ORDER BY be.order_index
    `).all(block.id) as Record<string, unknown>[]

    return {
      ...block,
      block_exercises: rows.map(r => ({
        id: r.id as string,
        block_id: r.block_id as string,
        exercise_id: r.exercise_id as string,
        order_index: r.order_index as number,
        sets: r.sets as number | null,
        reps: r.reps as number | null,
        duration_seconds: r.duration_seconds as number | null,
        rest_seconds: r.rest_seconds as number | null,
        intensity_type: (r.intensity_type as 'rpe' | 'rir' | '1rm' | null) ?? null,
        intensity_value: r.intensity_value as number | null,
        notes: r.notes as string | null,
        exercise: r.e_name ? {
          id: r.exercise_id as string,
          name: r.e_name as string,
          description: r.e_desc as string | null,
          video_type: r.e_vtype as Exercise['video_type'],
          video_url: r.e_vurl as string | null,
          thumbnail_url: r.e_thumb as string | null,
          duration_seconds: r.e_dur as number | null,
          tags: JSON.parse((r.e_tags as string) || '[]'),
          created_at: '',
          category_id: null,
        } : null,
      })),
    }
  })
}

export function getRoutineWithBlocks(id: string): RoutineWithBlocks | null {
  const routine = db.prepare(`SELECT * FROM routines WHERE id = ?`).get(id) as Routine | null
  if (!routine) return null

  const dayRows = db.prepare(
    `SELECT * FROM routine_days WHERE routine_id = ? ORDER BY order_index`
  ).all(id) as RoutineDay[]

  const days: DayWithBlocks[] = dayRows.map(day => ({
    ...day,
    blocks: fetchBlocksForParent(day.id, 'day_id'),
  }))

  const blocks = fetchBlocksForParent(id, 'routine_id_no_day')

  return { ...routine, days, blocks }
}
