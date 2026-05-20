'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { randomUUID } from 'crypto'

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  birth_date: z.string().optional(),
  consultation_reason: z.string().optional(),
  notes: z.string().optional(),
})

export async function createPatient(formData: FormData) {
  await requireAuth()

  const parsed = schema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    birth_date: formData.get('birth_date') || undefined,
    consultation_reason: formData.get('consultation_reason') || undefined,
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) redirect('/pacientes/nuevo')

  const id = randomUUID()
  const token = randomUUID().replace(/-/g, '')

  db.prepare(`
    INSERT INTO patients (id, first_name, last_name, birth_date, consultation_reason, notes, public_token)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    parsed.data.first_name,
    parsed.data.last_name,
    parsed.data.birth_date ?? null,
    parsed.data.consultation_reason ?? null,
    parsed.data.notes ?? null,
    token,
  )

  revalidatePath('/pacientes')
  redirect(`/pacientes/${id}`)
}

export async function updatePatientPlan(id: string, data: {
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
    UPDATE patients SET
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
  revalidatePath(`/pacientes/${id}`)
}

export async function togglePatientActive(id: string, current: 0 | 1) {
  await requireAuth()
  db.prepare(`UPDATE patients SET is_active = ? WHERE id = ?`).run(current === 1 ? 0 : 1, id)
  revalidatePath(`/pacientes/${id}`)
  revalidatePath('/pacientes')
}

export async function updatePatientNotes(id: string, notes: string | null) {
  await requireAuth()
  db.prepare(`UPDATE patients SET notes = ? WHERE id = ?`).run(notes || null, id)
  revalidatePath(`/pacientes/${id}`)
}

export async function deletePatient(id: string) {
  await requireAuth()
  db.prepare(`DELETE FROM patients WHERE id = ?`).run(id)
  revalidatePath('/pacientes')
  redirect('/pacientes')
}
