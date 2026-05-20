'use client'

import { useTransition } from 'react'
import { togglePatientActive } from '@/lib/db/actions/patients'

export function ToggleActiveButton({ patientId, isActive }: { patientId: string; isActive: 0 | 1 }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => togglePatientActive(patientId, isActive))}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-300 hover:text-red-500'
          : 'border-[var(--accent-teal)] text-[var(--accent-teal)] hover:bg-[var(--accent-teal-light)]'
      }`}
    >
      {pending ? '...' : isActive ? 'Marcar inactivo' : 'Marcar activo'}
    </button>
  )
}
