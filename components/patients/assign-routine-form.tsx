'use client'

import { useState } from 'react'
import { createAssignment } from '@/lib/db/actions/assignments'
import type { Routine } from '@/lib/db/types'

export function AssignRoutineForm({
  patientId,
  routines,
}: {
  patientId: string
  routines: Routine[]
}) {
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    await createAssignment(fd)
    setPending(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <input type="hidden" name="patient_id" value={patientId} />

      <div>
        <label htmlFor="routine_id" className="block text-sm mb-1.5">Rutina</label>
        <select
          id="routine_id"
          name="routine_id"
          required
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
        >
          <option value="">Seleccionar rutina...</option>
          {routines.map(r => (
            <option key={r.id} value={r.id}>
              {r.name}{r.body_zone ? ` — ${r.body_zone}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start_date" className="block text-sm mb-1.5">Inicio</label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={today}
            required
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm mb-1.5">Fin <span className="text-[var(--muted-foreground)] font-normal">(opcional)</span></label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="frequency_per_week" className="block text-sm mb-1.5">Frec./semana</label>
          <input
            id="frequency_per_week"
            name="frequency_per_week"
            type="number"
            min="1"
            max="7"
            placeholder="3"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
        </div>
        <div>
          <label htmlFor="total_sessions" className="block text-sm mb-1.5">Total sesiones</label>
          <input
            id="total_sessions"
            name="total_sessions"
            type="number"
            min="1"
            placeholder="12"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--accent-teal)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {pending ? 'Asignando...' : 'Asignar rutina'}
      </button>
    </form>
  )
}
