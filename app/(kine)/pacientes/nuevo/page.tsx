import { createPatient } from '@/lib/db/actions/patients'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NuevoPacientePage() {
  return (
    <div className="max-w-lg">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Pacientes
      </Link>

      <h1 className="text-lg font-medium mb-6">Nuevo paciente</h1>

      <form action={createPatient} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm mb-1.5">Nombre</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm mb-1.5">Apellido</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="birth_date" className="block text-sm mb-1.5">Fecha de nacimiento</label>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
        </div>

        <div>
          <label htmlFor="consultation_reason" className="block text-sm mb-1.5">Motivo de consulta</label>
          <input
            id="consultation_reason"
            name="consultation_reason"
            type="text"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm mb-1.5">Notas clínicas</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Crear paciente
          </button>
          <Link
            href="/pacientes"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
