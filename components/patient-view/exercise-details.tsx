'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

// Nombre + dosificación del ejercicio, con un botón de info que despliega
// la descripción para que el paciente la consulte cuando quiera.
export function ExerciseDetails({
  name,
  dose,
  description,
}: {
  name: string
  dose: string
  description: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="font-medium text-base">{name}</p>
        {description && (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label="Ver descripción del ejercicio"
            aria-expanded={open}
            title="Ver descripción"
            className={`inline-flex items-center justify-center size-5 rounded-full transition-colors ${
              open ? 'text-[var(--accent-teal)]' : 'text-[var(--muted-foreground)] hover:text-[var(--accent-teal)]'
            }`}
          >
            <Info className="size-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-[var(--accent-teal)] font-medium mt-0.5">{dose}</p>

      {description && open && (
        <p className="text-sm text-[var(--muted-foreground)] mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed rounded-md bg-[var(--muted)]/50 p-3 max-w-full">
          {description}
        </p>
      )}
    </div>
  )
}
