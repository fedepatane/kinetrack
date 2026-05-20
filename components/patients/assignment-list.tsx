'use client'

import { useState, useTransition } from 'react'
import { updateAssignmentStatus, updateAssignmentEndDate } from '@/lib/db/actions/assignments'
import Link from 'next/link'
import { ChevronDown, ChevronUp, CalendarRange, Pencil, Check, X } from 'lucide-react'
import type { AssignmentWithRoutine } from '@/lib/db/queries/patients'

const statusLabel: Record<string, string> = { active: 'activa', completed: 'completada', paused: 'pausada' }
const statusClasses: Record<string, string> = {
  active: 'bg-[var(--accent-teal-light)] text-[var(--accent-teal)]',
  completed: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  paused: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)]',
}

function EndDateEditor({ assignment, patientId }: { assignment: AssignmentWithRoutine; patientId: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(assignment.end_date ?? '')
  const [, startTransition] = useTransition()

  function save() {
    startTransition(() => updateAssignmentEndDate(assignment.id, value || null, patientId))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <input
          type="date"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="rounded border border-[var(--accent-teal)] bg-[var(--background)] px-1.5 py-0.5 text-xs focus:outline-none"
        />
        <button onClick={save} className="text-[var(--accent-teal)] hover:opacity-70"><Check className="size-3" /></button>
        <button onClick={() => setEditing(false)} className="text-[var(--muted-foreground)] hover:opacity-70"><X className="size-3" /></button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors group mt-1"
    >
      <CalendarRange className="size-3 flex-shrink-0" />
      {assignment.end_date
        ? `hasta ${new Date(assignment.end_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
        : <span className="opacity-0 group-hover:opacity-100 transition-opacity">+ fecha de fin</span>
      }
      <Pencil className="size-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
}

function AssignmentCard({ a, patientId }: { a: AssignmentWithRoutine; patientId: string }) {
  const [, startTransition] = useTransition()

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/rutinas/${a.routine?.id}`} className="text-sm font-medium hover:text-[var(--accent-teal)] transition-colors">
            {a.routine?.name ?? 'Rutina eliminada'}
          </Link>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusClasses[a.status]}`}>
            {statusLabel[a.status]}
          </span>
        </div>
        <div className="text-xs text-[var(--muted-foreground)] flex gap-3 flex-wrap">
          <span>Desde {new Date(a.start_date + 'T12:00:00').toLocaleDateString('es-AR')}</span>
          {a.frequency_per_week && <span>{a.frequency_per_week}×/sem</span>}
          {a.routine?.estimated_minutes && <span>{a.routine.estimated_minutes} min</span>}
        </div>
        {a.status === 'active' && (
          <EndDateEditor assignment={a} patientId={patientId} />
        )}
        {a.status !== 'active' && a.end_date && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
            <CalendarRange className="size-3" />
            hasta {new Date(a.end_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        )}
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {a.status !== 'active' && (
          <button onClick={() => startTransition(() => updateAssignmentStatus(a.id, 'active', patientId))}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
            activar
          </button>
        )}
        {a.status === 'active' && (<>
          <button onClick={() => startTransition(() => updateAssignmentStatus(a.id, 'paused', patientId))}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] transition-colors">
            pausar
          </button>
          <button onClick={() => startTransition(() => updateAssignmentStatus(a.id, 'completed', patientId))}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--muted-foreground)] transition-colors">
            completar
          </button>
        </>)}
      </div>
    </div>
  )
}

export function AssignmentList({ assignments, patientId }: { assignments: AssignmentWithRoutine[]; patientId: string }) {
  const [showHistory, setShowHistory] = useState(false)

  if (assignments.length === 0) {
    return <p className="text-sm text-[var(--muted-foreground)] italic">Sin rutinas asignadas.</p>
  }

  const active = assignments.filter(a => a.status === 'active')
  const history = assignments.filter(a => a.status !== 'active')

  return (
    <div className="space-y-4">
      {/* Activas */}
      {active.length > 0 ? (
        <div className="space-y-2">
          {active.map(a => <AssignmentCard key={a.id} a={a} patientId={patientId} />)}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)] italic">Sin rutinas activas.</p>
      )}

      {/* Historial */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {showHistory ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            Historial ({history.length} rutina{history.length !== 1 ? 's' : ''})
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2 opacity-70">
              {history.map(a => <AssignmentCard key={a.id} a={a} patientId={patientId} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
