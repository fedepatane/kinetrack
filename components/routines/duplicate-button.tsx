'use client'

import { useTransition } from 'react'
import { duplicateRoutine } from '@/lib/db/actions/routines'
import { Copy } from 'lucide-react'

export function DuplicateRoutineButton({ routineId }: { routineId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={e => {
        e.preventDefault()
        startTransition(() => duplicateRoutine(routineId))
      }}
      disabled={pending}
      title="Clonar rutina"
      className="p-1.5 rounded text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] hover:bg-[var(--accent-teal-light)] transition-colors disabled:opacity-50"
    >
      <Copy className="size-3.5" />
    </button>
  )
}
