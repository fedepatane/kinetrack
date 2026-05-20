'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { updatePatientNotes } from '@/lib/db/actions/patients'
import { Pencil, Check, X, Lock } from 'lucide-react'

export function PrivateNotes({ patientId, initialNotes }: { patientId: string; initialNotes: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState(false)
  const [, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  function handleSave() {
    startTransition(async () => {
      await updatePatientNotes(patientId, value.trim() || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setEditing(false)
    })
  }

  function handleCancel() {
    setValue(initialNotes ?? '')
    setEditing(false)
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 text-[var(--muted-foreground)]" />
          <h2 className="text-sm font-medium">Notas privadas</h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Pencil className="size-3" />
            {value ? 'Editar' : 'Agregar nota'}
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-xs text-[var(--accent-teal)] hover:opacity-75 transition-opacity font-medium"
            >
              <Check className="size-3.5" /> Guardar
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="size-3.5" /> Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') handleCancel() }}
            placeholder="Escribí acá notas internas sobre el paciente. Solo vos las ves."
            rows={5}
            className="w-full bg-transparent text-sm focus:outline-none resize-none placeholder:text-[var(--muted-foreground)] text-[var(--foreground)]"
          />
        ) : value ? (
          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{value}</p>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-left w-full"
          >
            Sin notas. Hacé click para agregar...
          </button>
        )}
        {saved && (
          <p className="text-xs text-[var(--accent-teal)] mt-2 flex items-center gap-1">
            <Check className="size-3" /> Guardado
          </p>
        )}
      </div>
    </div>
  )
}
