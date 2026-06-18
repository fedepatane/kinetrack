import { notFound } from 'next/navigation'
import { getRoutineWithBlocks } from '@/lib/db/queries/routines'
import { db } from '@/lib/db'
import type { Routine } from '@/lib/db/types'
import { Clock } from 'lucide-react'
import { RoutineDayTabs } from '@/components/patient-view/routine-day-tabs'
import { CollapsibleBlock } from '@/components/patient-view/routine-blocks'

export default async function PublicRoutinePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const routineRow = db
    .prepare(`SELECT * FROM routines WHERE public_token = ?`)
    .get(token) as Routine | null
  if (!routineRow) notFound()

  const routine = getRoutineWithBlocks(routineRow.id)
  if (!routine) notFound()

  const hasDays = routine.days.length > 0

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* Header con acento de color */}
      <header className="bg-[var(--accent-teal)] text-white">
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-medium">{routine.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-white/80 text-sm flex-wrap">
                {routine.estimated_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />{routine.estimated_minutes} min
                  </span>
                )}
                {hasDays && (
                  <span>{routine.days.length} días</span>
                )}
              </div>
              {routine.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {routine.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">{tag}</span>
                  ))}
                </div>
              )}
              {routine.description && (
                <p className="mt-2 text-white/80 text-sm">{routine.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        {hasDays ? (
          <RoutineDayTabs days={routine.days} />
        ) : (
          <div className="space-y-3">
            {routine.blocks.map(block => (
              <CollapsibleBlock key={block.id} block={block} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
