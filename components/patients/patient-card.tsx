import Link from 'next/link'
import type { Patient } from '@/lib/db/types'
import { PatientAvatar } from './patient-avatar'
import { ChevronRight } from 'lucide-react'

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Link
      href={`/pacientes/${patient.id}`}
      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--accent-teal)] transition-colors group"
    >
      <PatientAvatar firstName={patient.first_name} lastName={patient.last_name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">
          {patient.first_name} {patient.last_name}
        </p>
        {patient.consultation_reason && (
          <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
            {patient.consultation_reason}
          </p>
        )}
      </div>
      <ChevronRight className="size-4 text-[var(--muted-foreground)] group-hover:text-[var(--accent-teal)] transition-colors flex-shrink-0" />
    </Link>
  )
}
