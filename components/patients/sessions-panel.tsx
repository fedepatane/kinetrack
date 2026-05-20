'use client'

import { useState, useTransition } from 'react'
import { addPatientSession, deletePatientSession, updatePatientTotalSessions } from '@/lib/db/actions/patient-sessions'
import { Plus, Check, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import type { PatientSession } from '@/lib/db/types'

export function SessionsPanel({
  patientId,
  sessions,
  totalSessions,
}: {
  patientId: string
  sessions: PatientSession[]
  totalSessions: number | null
}) {
  const [, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [editingTotal, setEditingTotal] = useState(false)
  const [totalInput, setTotalInput] = useState(totalSessions?.toString() ?? '')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const done = sessions.length
  const remaining = totalSessions != null ? totalSessions - done : null

  function saveTotal() {
    const val = totalInput === '' ? null : parseInt(totalInput)
    startTransition(() => updatePatientTotalSessions(patientId, val))
    setEditingTotal(false)
  }

  function handleAdd() {
    startTransition(() => addPatientSession(patientId, date, notes.trim() || undefined))
    setAdding(false)
    setNotes('')
    setDate(new Date().toISOString().split('T')[0])
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)] overflow-hidden">

      {/* Resumen */}
      <div className="px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div>
            <span className="text-3xl font-medium text-[var(--foreground)]">{done}</span>
            <span className="text-sm text-[var(--muted-foreground)] ml-2">realizadas</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[var(--muted-foreground)] text-sm">de</span>
            {editingTotal ? (
              <div className="flex items-center gap-1">
                <input
                  type="number" min="0" value={totalInput}
                  onChange={e => setTotalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveTotal(); if (e.key === 'Escape') setEditingTotal(false) }}
                  autoFocus
                  className="w-16 rounded border border-[var(--accent-teal)] bg-[var(--background)] px-2 py-0.5 text-sm focus:outline-none"
                />
                <button onClick={saveTotal} className="text-[var(--accent-teal)] hover:opacity-70"><Check className="size-3.5" /></button>
                <button onClick={() => setEditingTotal(false)} className="text-[var(--muted-foreground)] hover:opacity-70"><X className="size-3.5" /></button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTotal(true)}
                className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors group"
              >
                <span className="font-medium">{totalSessions ?? '—'}</span>
                <Pencil className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>
            )}
          </div>

          {remaining != null && (
            <>
              <div className="text-[var(--muted-foreground)] text-sm">·</div>
              <div>
                <span className={`text-sm font-medium ${remaining <= 2 ? 'text-[var(--accent-amber)]' : 'text-[var(--muted-foreground)]'}`}>
                  {remaining} restantes
                </span>
              </div>
            </>
          )}
        </div>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-teal)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" /> Registrar sesión
          </button>
        )}
      </div>

      {/* Barra de progreso */}
      {totalSessions != null && totalSessions > 0 && (
        <div className="px-4 py-2">
          <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-teal)] rounded-full transition-all"
              style={{ width: `${Math.min(100, (done / totalSessions) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Formulario agregar */}
      {adding && (
        <div className="px-4 py-3 space-y-2 bg-[var(--muted)]/40">
          <div className="flex items-center gap-3">
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
            />
            <button
              onClick={handleAdd}
              className="p-1.5 rounded bg-[var(--accent-teal)] text-white hover:opacity-90"
            >
              <Check className="size-3.5" />
            </button>
            <button
              onClick={() => { setAdding(false); setNotes('') }}
              className="p-1.5 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones de la sesión (opcional)..."
            rows={2}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none"
          />
        </div>
      )}

      {/* Lista */}
      {sessions.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
          Sin sesiones registradas todavía.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {[...sessions].reverse().map((s, i) => (
            <div key={s.id}>
              <div className="group flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] w-8 flex-shrink-0">
                    #{sessions.length - i}
                  </span>
                  <span className="text-sm">
                    {new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-AR', {
                      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </span>
                  {s.notes && (
                    <button
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="flex items-center gap-0.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors ml-1"
                    >
                      {expandedId === s.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      nota
                    </button>
                  )}
                </div>
                <button
                  onClick={() => startTransition(() => deletePatientSession(s.id, patientId))}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-all flex-shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              {s.notes && expandedId === s.id && (
                <div className="px-4 pb-3 ml-11">
                  <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] rounded-md px-3 py-2 whitespace-pre-wrap">
                    {s.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
