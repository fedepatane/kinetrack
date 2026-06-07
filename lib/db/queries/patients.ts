import { db } from '@/lib/db'
import type { Patient, Assignment, Routine, PatientSession } from '@/lib/db/types'

export function getPatients(q?: string): Patient[] {
  if (q) {
    const like = `%${q}%`
    return db.prepare(`
      SELECT * FROM patients
      WHERE first_name LIKE ? OR last_name LIKE ? OR consultation_reason LIKE ?
      ORDER BY first_name, last_name
    `).all(like, like, like) as Patient[]
  }
  return db.prepare(`SELECT * FROM patients ORDER BY first_name, last_name`).all() as Patient[]
}

export function getPatient(id: string): Patient | null {
  return db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id) as Patient | null
}

export type SessionLogRow = { id: string; completed_at: string; pain_level: number | null; patient_notes: string | null }

export type AssignmentWithRoutine = Assignment & {
  routine: Routine | null
  session_logs: SessionLogRow[]
}

export type PatientWithAssignments = Patient & {
  assignments: AssignmentWithRoutine[]
  patient_sessions: PatientSession[]
}

export function getPatientWithAssignments(id: string): PatientWithAssignments | null {
  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id) as Patient | null
  if (!patient) return null

  const rows = db.prepare(`
    SELECT a.*,
      r.id as r_id, r.name as r_name, r.body_zone as r_body_zone,
      r.difficulty as r_difficulty, r.estimated_minutes as r_estimated_minutes,
      r.public_token as r_public_token
    FROM assignments a
    LEFT JOIN routines r ON r.id = a.routine_id
    WHERE a.patient_id = ?
    ORDER BY a.created_at DESC
  `).all(id) as Record<string, unknown>[]

  const assignments: AssignmentWithRoutine[] = rows.map(row => {
    const logs = db.prepare(
      `SELECT * FROM session_logs WHERE assignment_id = ? ORDER BY completed_at ASC`
    ).all(row.id as string) as SessionLogRow[]

    return {
      id: row.id as string,
      patient_id: row.patient_id as string,
      routine_id: row.routine_id as string,
      start_date: row.start_date as string,
      end_date: row.end_date as string | null,
      frequency_per_week: row.frequency_per_week as number | null,
      total_sessions: row.total_sessions as number | null,
      status: row.status as Assignment['status'],
      rehab_phase_current: row.rehab_phase_current as string | null,
      rehab_phase_next: row.rehab_phase_next as string | null,
      objectives: (row.objectives as string) || '[]',
      key_notes: (row.key_notes as string) || '[]',
      tracking_home: row.tracking_home as string | null,
      tracking_training: row.tracking_training as string | null,
      resources: (row.resources as string) || '[]',
      created_at: row.created_at as string,
      routine: row.r_id ? {
        id: row.r_id as string,
        name: row.r_name as string,
        body_zone: row.r_body_zone as string | null,
        difficulty: row.r_difficulty as Routine['difficulty'],
        estimated_minutes: row.r_estimated_minutes as number | null,
        tags: [],
        description: null,
        public_token: row.r_public_token as string | null,
        created_at: '',
      } : null,
      session_logs: logs,
    }
  })

  const patient_sessions = db.prepare(
    `SELECT * FROM patient_sessions WHERE patient_id = ? ORDER BY session_date ASC`
  ).all(id) as PatientSession[]

  return { ...patient, assignments, patient_sessions }
}
