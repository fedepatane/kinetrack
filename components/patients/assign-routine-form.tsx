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
  const [activeTag, setActiveTag] = useState('')
  const [routineId, setRoutineId] = useState('')

  // Tags únicos de todas las rutinas, ordenados
  const allTags = [...new Set(routines.flatMap(r => r.tags))].sort((a, b) =>
    a.localeCompare(b, 'es', { sensitivity: 'base' }))

  const filtered = activeTag ? routines.filter(r => r.tags.includes(activeTag)) : routines

  function toggleTag(tag: string) {
    const next = activeTag === tag ? '' : tag
    setActiveTag(next)
    // Si la rutina elegida ya no entra en el filtro, la deselecciono
    if (routineId && !(next ? routines.find(r => r.id === routineId)?.tags.includes(next) : true)) {
      setRoutineId('')
    }
  }

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
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {allTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-[var(--accent-teal)] text-white'
                    : 'bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] hover:bg-[var(--accent-teal)]/25'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        <select
          id="routine_id"
          name="routine_id"
          required
          value={routineId}
          onChange={e => setRoutineId(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
        >
          <option value="">Seleccionar rutina...</option>
          {filtered.map(r => (
            <option key={r.id} value={r.id}>
              {r.name}{r.tags.length ? ` — ${r.tags.join(', ')}` : ''}
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
