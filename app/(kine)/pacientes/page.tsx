import Link from 'next/link'
import { Suspense } from 'react'
import { getPatients } from '@/lib/db/queries/patients'
import { PatientCard } from '@/components/patients/patient-card'
import { SearchInput, ClearFilters } from '@/components/ui/filters'
import { Plus } from 'lucide-react'

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const patients = getPatients(q)

  const active   = patients.filter(p => p.is_active)
  const inactive = patients.filter(p => !p.is_active)
  const isEmpty  = patients.length === 0

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">Pacientes</h1>
        <Link
          href="/pacientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-teal)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="size-3.5" /> Nuevo paciente
        </Link>
      </div>

      <Suspense>
        <div className="flex items-center gap-2 mb-4">
          <SearchInput placeholder="Buscar por nombre o motivo..." />
          <ClearFilters />
        </div>
      </Suspense>

      {isEmpty ? (
        <div className="rounded-lg border border-[var(--border)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            {q ? `Sin resultados para "${q}".` : 'Todavía no hay pacientes.'}
          </p>
          {!q && (
            <Link href="/pacientes/nuevo" className="mt-3 inline-block text-sm text-[var(--accent-teal)] hover:underline">
              Agregar el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Activos */}
          {active.length > 0 && (
            <div className="space-y-2">
              {q && (
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide px-1 mb-2">
                  Activos ({active.length})
                </p>
              )}
              {active.map(patient => <PatientCard key={patient.id} patient={patient} />)}
            </div>
          )}

          {/* Inactivos */}
          {inactive.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer select-none list-none mb-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  Inactivos ({inactive.length})
                </span>
                <svg
                  className="size-3.5 text-[var(--muted-foreground)] transition-transform group-open:rotate-180"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="space-y-2 opacity-60">
                {inactive.map(patient => <PatientCard key={patient.id} patient={patient} />)}
              </div>
            </details>
          )}

        </div>
      )}
    </div>
  )
}
