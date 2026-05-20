import Link from 'next/link'
import { Suspense } from 'react'
import { getRoutines } from '@/lib/db/queries/routines'
import { RoutineCard } from '@/components/routines/routine-card'
import { SearchInput, SelectFilter, ClearFilters } from '@/components/ui/filters'
import { Plus } from 'lucide-react'
import { db } from '@/lib/db'

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; difficulty?: string; zone?: string }>
}) {
  const { q, difficulty, zone } = await searchParams
  const routines = getRoutines({ q, difficulty, bodyZone: zone })

  // Zonas únicas para el filtro
  const zones = (db.prepare(`SELECT DISTINCT body_zone FROM routines WHERE body_zone IS NOT NULL ORDER BY body_zone`).all() as { body_zone: string }[])
    .map(r => ({ value: r.body_zone, label: r.body_zone }))

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
          <SelectFilter
            name="difficulty"
            placeholder="Dificultad"
            options={[
              { value: 'suave', label: 'Suave' },
              { value: 'moderado', label: 'Moderado' },
              { value: 'intenso', label: 'Intenso' },
            ]}
          />
          {zones.length > 0 && (
            <SelectFilter name="zone" placeholder="Zona corporal" options={zones} />
          )}
          <ClearFilters />
        </div>
      </Suspense>

      {routines.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {q || difficulty || zone ? 'Sin resultados para los filtros aplicados.' : 'Todavía no hay rutinas.'}
          </p>
          {!q && !difficulty && !zone && (
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
