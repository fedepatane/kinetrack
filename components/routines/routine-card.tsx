import Link from 'next/link'
import type { Routine } from '@/lib/db/types'
import { Clock, Pencil } from 'lucide-react'
import { DuplicateRoutineButton } from './duplicate-button'
import { DeleteButton } from '@/components/ui/delete-button'
import { deleteRoutine } from '@/lib/db/actions/routines'

const difficultyColors: Record<string, string> = {
  suave: 'text-[var(--accent-teal)] bg-[var(--accent-teal-light)]',
  moderado: 'text-[var(--accent-amber)] bg-[var(--accent-amber-light)]',
  intenso: 'text-red-600 bg-red-50',
}

export function RoutineCard({ routine }: { routine: Routine }) {
  return (
    <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent-teal)] transition-colors group">
      <Link
        href={`/rutinas/${routine.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">{routine.name}</p>
            {routine.difficulty && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${difficultyColors[routine.difficulty]}`}>
                {routine.difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            {routine.body_zone && <span>{routine.body_zone}</span>}
            {routine.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {routine.estimated_minutes} min
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
        <Link
          href={`/rutinas/${routine.id}/editar`}
          title="Editar"
          className="p-1.5 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <Pencil className="size-3.5" />
        </Link>
        <DuplicateRoutineButton routineId={routine.id} />
        <DeleteButton
          onDelete={deleteRoutine.bind(null, routine.id)}
          confirm={`¿Eliminar "${routine.name}"? Se quitará de todas las asignaciones activas.`}
        />
      </div>
    </div>
  )
}
