'use client'

import { useState, useTransition } from 'react'
import { addPatientSession } from '@/lib/db/actions/patient-sessions'
import { CalendarPlus, Check } from 'lucide-react'

export function QuickRegisterButton({ patientId }: { patientId: string }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [done, setDone] = useState(false)
  const [, startTransition] = useTransition()

  function handleRegister() {
    startTransition(async () => {
      await addPatientSession(patientId, date)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    })
  }

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[var(--accent-teal)] font-medium">
        <Check className="size-3.5" /> Sesión registrada
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
      />
      <button
        onClick={handleRegister}
        className="flex items-center gap-1 rounded bg-[var(--accent-teal)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
      >
        <CalendarPlus className="size-3" /> Registrar sesión
      </button>
    </div>
  )
}
