'use client'

import { useState, useTransition } from 'react'
import { updatePatient } from '@/lib/db/actions/patients'
import { PatientAvatar } from '@/components/patients/patient-avatar'
import { Pencil, Check, X } from 'lucide-react'

type Props = {
  id: string
  firstName: string
  lastName: string
  birthDate: string | null
  consultationReason: string | null
  isActive: 0 | 1
}

const inputClass =
  'w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]'

export function PatientDetailsEditor({ id, firstName, lastName, birthDate, consultationReason, isActive }: Props) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const age = birthDate
    ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updatePatient(id, formData)
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-4">
        <PatientAvatar firstName={firstName} lastName={lastName} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-medium">{firstName} {lastName}</h1>
            {!isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] font-medium">inactivo</span>
            )}
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <Pencil className="size-3" /> Editar
            </button>
          </div>
          <div className="mt-1 text-sm text-[var(--muted-foreground)] space-y-0.5">
            {age !== null && <p>{age} años</p>}
            {consultationReason && <p>{consultationReason}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm mb-1.5">Nombre</label>
          <input id="first_name" name="first_name" type="text" required defaultValue={firstName} className={inputClass} />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm mb-1.5">Apellido</label>
          <input id="last_name" name="last_name" type="text" required defaultValue={lastName} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="birth_date" className="block text-sm mb-1.5">Fecha de nacimiento</label>
        <input id="birth_date" name="birth_date" type="date" defaultValue={birthDate ?? ''} className={inputClass} />
      </div>

      <div>
        <label htmlFor="consultation_reason" className="block text-sm mb-1.5">Motivo de consulta</label>
        <input id="consultation_reason" name="consultation_reason" type="text" defaultValue={consultationReason ?? ''} className={inputClass} />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Check className="size-3.5" /> {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <X className="size-3.5" /> Cancelar
        </button>
      </div>
    </form>
  )
}
