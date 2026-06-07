import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRoutineWithBlocks, getRoutineTags } from '@/lib/db/queries/routines'
import { getExercises } from '@/lib/db/queries/exercises'
import { getCategories } from '@/lib/db/queries/categories'
import { RoutineEditor } from '@/components/routines/routine-editor'
import { ArrowLeft } from 'lucide-react'

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const routine = getRoutineWithBlocks(id)
  if (!routine) notFound()

  const exercises = getExercises()
  const categories = getCategories()
  const allTags = getRoutineTags()

  return (
    <div className="max-w-2xl">
      <Link
        href={`/rutinas/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="size-3.5" /> {routine.name}
      </Link>

      <h1 className="text-lg font-medium mb-6">Editar rutina</h1>

      <RoutineEditor exercises={exercises} categories={categories} allTags={allTags} initialData={routine} />
    </div>
  )
}
