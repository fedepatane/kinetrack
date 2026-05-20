import Link from 'next/link'
import { Suspense } from 'react'
import { getExercises } from '@/lib/db/queries/exercises'
import { getCategories } from '@/lib/db/queries/categories'
import { ExerciseCard } from '@/components/exercises/exercise-card'
import { SearchInput, ClearFilters } from '@/components/ui/filters'
import { CategoryFilter } from '@/components/ui/category-filter'
import { Plus } from 'lucide-react'

export default async function EjerciciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sub?: string }>
}) {
  const { q, cat, sub } = await searchParams
  const [exercises, categories] = [
    getExercises({ q, cat, sub }),
    getCategories(),
  ]

  // Agrupar por categoría
  type Group = { label: string; sublabel?: string; items: typeof exercises }
  const groupMap = new Map<string, Group>()
  for (const ex of exercises) {
    let key: string, label: string, sublabel: string | undefined
    if (!ex.category) { key = '__none__'; label = 'Sin categoría' }
    else if (ex.parent_category) { key = ex.category.id; label = ex.parent_category.name; sublabel = ex.category.name }
    else { key = ex.category.id; label = ex.category.name }
    if (!groupMap.has(key)) groupMap.set(key, { label, sublabel, items: [] })
    groupMap.get(key)!.items.push(ex)
  }
  const groups = [...groupMap.entries()].sort(([a], [b]) => a === '__none__' ? 1 : b === '__none__' ? -1 : 0)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">Ejercicios</h1>
        <Link
          href="/ejercicios/nuevo"
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-teal)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="size-3.5" /> Nuevo ejercicio
        </Link>
      </div>

      <Suspense>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <SearchInput placeholder="Buscar ejercicio..." />
          {categories.length > 0 && <CategoryFilter categories={categories} />}
          <ClearFilters />
        </div>
      </Suspense>

      {exercises.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {q || cat ? 'Sin resultados para los filtros aplicados.' : 'Todavía no hay ejercicios.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([key, group]) => (
            <div key={key}>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{group.label}</h2>
                {group.sublabel && <>
                  <span className="text-[var(--muted-foreground)] text-xs">›</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{group.sublabel}</span>
                </>}
              </div>
              <div className="space-y-2">
                {group.items.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
