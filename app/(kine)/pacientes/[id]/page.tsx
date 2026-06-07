import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatientWithAssignments } from '@/lib/db/queries/patients'
import { getRoutines } from '@/lib/db/queries/routines'
import { PatientDetailsEditor } from '@/components/patients/patient-details-editor'
import { AssignmentList } from '@/components/patients/assignment-list'
import { AssignRoutineForm } from '@/components/patients/assign-routine-form'
import { PublicLinkCopy } from '@/components/patients/public-link-copy'
import { PatientPlanEditor } from '@/components/patients/patient-plan-editor'
import { SessionsPanel } from '@/components/patients/sessions-panel'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { DeleteButton } from '@/components/ui/delete-button'
import { deletePatient } from '@/lib/db/actions/patients'
import { PrivateNotes } from '@/components/patients/private-notes'
import { ToggleActiveButton } from '@/components/patients/toggle-active-button'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [patient, routines] = await Promise.all([
    getPatientWithAssignments(id),
    getRoutines(),
  ])
  if (!patient) notFound()

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="size-3.5" /> Pacientes
        </Link>
        <div className="flex items-center gap-2">
          <ToggleActiveButton patientId={patient.id} isActive={patient.is_active} />
          <DeleteButton
            onDelete={deletePatient.bind(null, patient.id)}
            confirm={`¿Eliminar a ${patient.first_name} ${patient.last_name}? Se borrarán todas sus asignaciones y sesiones.`}
            label="Eliminar paciente"
          />
        </div>
      </div>

      {/* Header */}
      <PatientDetailsEditor
        id={patient.id}
        firstName={patient.first_name}
        lastName={patient.last_name}
        birthDate={patient.birth_date}
        consultationReason={patient.consultation_reason}
        isActive={patient.is_active}
      />

      {/* Notas privadas */}
      <section>
        <PrivateNotes patientId={patient.id} initialNotes={patient.notes} />
      </section>

      {/* Link público */}
      <section>
        <div className="flex items-center justify-between mb-2 gap-2">
          <h2 className="text-sm font-medium">Link del paciente</h2>
          <a
            href={`/p/${patient.public_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-teal)] hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <ExternalLink className="size-3.5" /> Ver como el paciente
          </a>
        </div>
        <PublicLinkCopy path={`/p/${patient.public_token}`} />
      </section>

      {/* Plan e indicaciones */}
      <section>
        <h2 className="text-sm font-medium mb-3">Plan e indicaciones</h2>
        <PatientPlanEditor patient={patient} />
      </section>

      {/* Sesiones */}
      <section>
        <h2 className="text-sm font-medium mb-3">Sesiones</h2>
        <SessionsPanel
          patientId={patient.id}
          sessions={patient.patient_sessions ?? []}
          totalSessions={patient.total_sessions}
        />
      </section>

      {/* Rutinas asignadas */}
      <section>
        <h2 className="text-sm font-medium mb-3">Rutinas asignadas</h2>
        <AssignmentList assignments={patient.assignments ?? []} patientId={patient.id} />
      </section>

      {/* Asignar rutina */}
      {routines.length > 0 && (
        <section>
          <h2 className="text-sm font-medium mb-3">Asignar rutina</h2>
          <AssignRoutineForm patientId={patient.id} routines={routines} />
        </section>
      )}
    </div>
  )
}
