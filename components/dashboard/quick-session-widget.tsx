'use client'

import { useState, useTransition } from 'react'
import { addPatientSession } from '@/lib/db/actions/patient-sessions'
import { Check, X, ChevronDown } from 'lucide-react'

interface Patient { id: string; first_name: string; last_name: string }

export function QuickSessionWidget({ patients }: { patients: Patient[] }) {
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) return
    startTransition(async () => {
      await addPatientSession(patientId, date, notes.trim() || undefined)
      setDone(true)
      setTimeout(() => {
        setDone(false)
        setPatientId('')
        setNotes('')
        setDate(new Date().toISOString().split('T')[0])
        setOpen(false)
      }, 1500)
    })
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-[var(--muted)]/50 transition-colors"
      >
        <span>Registrar sesión</span>
        <ChevronDown className={`size-4 text-[var(--muted-foreground)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-4 py-3 space-y-2.5 bg-[var(--muted)]/30">
          <div className="flex gap-2">
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              required
              className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
            />
          </div>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones (opcional)..."
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!patientId || pending || done}
              className="flex items-center gap-1.5 rounded bg-[var(--accent-teal)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {done ? <><Check className="size-3.5" /> Registrada</> : pending ? 'Guardando...' : <><Check className="size-3.5" /> Confirmar</>}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="size-3.5" /> Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
