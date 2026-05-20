'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { randomUUID } from 'crypto'
import { redirect } from 'next/navigation'

const schema = z.object({
  patient_id: z.string().uuid(),
  routine_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string().optional(),
  frequency_per_week: z.coerce.number().optional(),
  total_sessions: z.coerce.number().optional(),
})

export async function createAssignment(formData: FormData) {
  await requireAuth()
  const parsed = schema.safeParse({
    patient_id: formData.get('patient_id'),
    routine_id: formData.get('routine_id'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date') || undefined,
    frequency_per_week: formData.get('frequency_per_week') || undefined,
    total_sessions: formData.get('total_sessions') || undefined,
  })
  if (!parsed.success) return
  db.prepare(`
    INSERT INTO assignments (id, patient_id, routine_id, start_date, end_date, frequency_per_week, total_sessions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), parsed.data.patient_id, parsed.data.routine_id, parsed.data.start_date,
    parsed.data.end_date ?? null, parsed.data.frequency_per_week ?? null, parsed.data.total_sessions ?? null)
  revalidatePath(`/pacientes/${parsed.data.patient_id}`)
}

export async function updateAssignmentEndDate(id: string, endDate: string | null, patientId: string) {
  await requireAuth()
  db.prepare(`UPDATE assignments SET end_date = ? WHERE id = ?`).run(endDate, id)
  revalidatePath(`/pacientes/${patientId}`)
}

export async function updateAssignmentStatus(id: string, status: 'active' | 'completed' | 'paused', patientId: string) {
  await requireAuth()
  db.prepare(`UPDATE assignments SET status = ? WHERE id = ?`).run(status, id)
  revalidatePath(`/pacientes/${patientId}`)
}

export async function updateAssignmentPlan(id: string, patientId: string, data: {
  rehab_phase_current: string | null
  rehab_phase_next: string | null
  objectives: string[]
  key_notes: string[]
  tracking_home: string | null
  tracking_training: string | null
  resources: { label: string; url: string }[]
}) {
  await requireAuth()
  db.prepare(`
    UPDATE assignments SET
      rehab_phase_current = ?, rehab_phase_next = ?,
      objectives = ?, key_notes = ?,
      tracking_home = ?, tracking_training = ?,
      resources = ?
    WHERE id = ?
  `).run(
    data.rehab_phase_current, data.rehab_phase_next,
    JSON.stringify(data.objectives), JSON.stringify(data.key_notes),
    data.tracking_home, data.tracking_training,
    JSON.stringify(data.resources), id,
  )
  revalidatePath(`/pacientes/${patientId}`)
}

export async function logSessionByKine(assignmentId: string, patientId: string, date: string) {
  await requireAuth()
  db.prepare(`
    INSERT INTO session_logs (id, assignment_id, completed_at)
    VALUES (?, ?, ?)
  `).run(randomUUID(), assignmentId, date + 'T12:00:00')
  revalidatePath(`/pacientes/${patientId}`)
}

export async function deleteSessionLog(sessionId: string, patientId: string) {
  await requireAuth()
  db.prepare(`DELETE FROM session_logs WHERE id = ?`).run(sessionId)
  revalidatePath(`/pacientes/${patientId}`)
}
