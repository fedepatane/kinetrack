import Link from 'next/link'
import { Suspense } from 'react'
import { getRoutines, getRoutineTags } from '@/lib/db/queries/routines'
import { RoutineCard } from '@/components/routines/routine-card'
import { SearchInput, SelectFilter, ClearFilters } from '@/components/ui/filters'
import { Plus } from 'lucide-react'

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const { q, tag } = await searchParams
  const routines = getRoutines({ q, tag })

  const tagOptions = getRoutineTags().map(t => ({ value: t, label: t }))

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">Rutinas</h1>
        <Link
          href="/rutinas/nueva"
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-teal)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="size-3.5" /> Nueva rutina
        </Link>
      </div>

      <Suspense>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <SearchInput placeholder="Buscar rutina..." />
          {tagOptions.length > 0 && (
            <SelectFilter name="tag" placeholder="Tag" options={tagOptions} />
          )}
          <ClearFilters />
        </div>
      </Suspense>

      {routines.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {q || tag ? 'Sin resultados para los filtros aplicados.' : 'Todavía no hay rutinas.'}
          </p>
          {!q && !tag && (
            <Link href="/rutinas/nueva" className="mt-3 inline-block text-sm text-[var(--accent-teal)] hover:underline">
              Crear la primera
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {routines.map(r => <RoutineCard key={r.id} routine={r} />)}
        </div>
      )}
    </div>
  )
}
