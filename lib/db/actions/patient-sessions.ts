'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { randomUUID } from 'crypto'

export async function addPatientSession(patientId: string, date: string, notes?: string) {
  await requireAuth()
  db.prepare(`INSERT INTO patient_sessions (id, patient_id, session_date, notes) VALUES (?, ?, ?, ?)`)
    .run(randomUUID(), patientId, date, notes ?? null)
  revalidatePath(`/pacientes/${patientId}`)
}

export async function deletePatientSession(sessionId: string, patientId: string) {
  await requireAuth()
  db.prepare(`DELETE FROM patient_sessions WHERE id = ?`).run(sessionId)
  revalidatePath(`/pacientes/${patientId}`)
}

export async function updatePatientTotalSessions(patientId: string, total: number | null) {
  await requireAuth()
  db.prepare(`UPDATE patients SET total_sessions = ? WHERE id = ?`).run(total, patientId)
  revalidatePath(`/pacientes/${patientId}`)
}
