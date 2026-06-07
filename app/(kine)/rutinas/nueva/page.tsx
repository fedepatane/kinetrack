import { getExercises } from '@/lib/db/queries/exercises'
import { getCategories } from '@/lib/db/queries/categories'
import { getRoutineTags } from '@/lib/db/queries/routines'
import { RoutineEditor } from '@/components/routines/routine-editor'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NuevaRutinaPage() {
  const exercises = getExercises()
  const categories = getCategories()
  const allTags = getRoutineTags()

  return (
    <div className="max-w-2xl">
      <Link
        href="/rutinas"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Rutinas
      </Link>

      <h1 className="text-lg font-medium mb-6">Nueva rutina</h1>

      <RoutineEditor exercises={exercises} categories={categories} allTags={allTags} />
    </div>
  )
}
