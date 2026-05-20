import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPatientWithAssignments } from '@/lib/db/queries/patients'
import { getRoutines } from '@/lib/db/queries/routines'
import { PatientAvatar } from '@/components/patients/patient-avatar'
import { AssignmentList } from '@/components/patients/assignment-list'
import { AssignRoutineForm } from '@/components/patients/assign-routine-form'
import { PublicLinkCopy } from '@/components/patients/public-link-copy'
import { PatientPlanEditor } from '@/components/patients/patient-plan-editor'
import { SessionsPanel } from '@/components/patients/sessions-panel'
import { ArrowLeft } from 'lucide-react'
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

  const age = patient.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/p/${patient.public_token}`

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
      <div className="flex items-start gap-4">
        <PatientAvatar firstName={patient.first_name} lastName={patient.last_name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-medium">{patient.first_name} {patient.last_name}</h1>
            {!patient.is_active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] font-medium">inactivo</span>
            )}
          </div>
          <div className="mt-1 text-sm text-[var(--muted-foreground)] space-y-0.5">
            {age !== null && <p>{age} años</p>}
            {patient.consultation_reason && <p>{patient.consultation_reason}</p>}
          </div>
        </div>
      </div>

      {/* Notas privadas */}
      <section>
        <PrivateNotes patientId={patient.id} initialNotes={patient.notes} />
      </section>

      {/* Link público */}
      <section>
        <h2 className="text-sm font-medium mb-2">Link del paciente</h2>
        <PublicLinkCopy url={publicUrl} />
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
