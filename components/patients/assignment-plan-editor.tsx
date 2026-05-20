'use client'

import { useState, useTransition } from 'react'
import { updateAssignmentPlan } from '@/lib/db/actions/assignments'
import type { Assignment } from '@/lib/db/types'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Resource = { label: string; url: string }

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={e => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
            placeholder={placeholder}
            className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors"
      >
        <Plus className="size-3" /> Agregar
      </button>
    </div>
  )
}

function ResourceEditor({
  items,
  onChange,
}: {
  items: Resource[]
  onChange: (v: Resource[]) => void
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item.label}
            onChange={e => {
              const next = [...items]
              next[i] = { ...next[i], label: e.target.value }
              onChange(next)
            }}
            placeholder="Título"
            className="w-32 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
          <input
            value={item.url}
            onChange={e => {
              const next = [...items]
              next[i] = { ...next[i], url: e.target.value }
              onChange(next)
            }}
            placeholder="https://..."
            className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { label: '', url: '' }])}
        className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors"
      >
        <Plus className="size-3" /> Agregar recurso
      </button>
    </div>
  )
}

export function AssignmentPlanEditor({
  assignment,
  patientId,
}: {
  assignment: Assignment
  patientId: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [rehabCurrent, setRehabCurrent] = useState(assignment.rehab_phase_current ?? '')
  const [rehabNext, setRehabNext] = useState(assignment.rehab_phase_next ?? '')
  const [objectives, setObjectives] = useState<string[]>(
    JSON.parse(assignment.objectives || '[]')
  )
  const [keyNotes, setKeyNotes] = useState<string[]>(
    JSON.parse(assignment.key_notes || '[]')
  )
  const [trackingHome, setTrackingHome] = useState(assignment.tracking_home ?? '')
  const [trackingTraining, setTrackingTraining] = useState(assignment.tracking_training ?? '')
  const [resources, setResources] = useState<Resource[]>(
    JSON.parse(assignment.resources || '[]')
  )

  function save() {
    startTransition(async () => {
      await updateAssignmentPlan(assignment.id, patientId, {
        rehab_phase_current: rehabCurrent || null,
        rehab_phase_next: rehabNext || null,
        objectives: objectives.filter(Boolean),
        key_notes: keyNotes.filter(Boolean),
        tracking_home: trackingHome || null,
        tracking_training: trackingTraining || null,
        resources: resources.filter(r => r.url),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="border-t border-[var(--border)]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <span>Plan e indicaciones</span>
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-5">

          {/* Fase */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Fase actual</label>
              <input
                value={rehabCurrent}
                onChange={e => setRehabCurrent(e.target.value)}
                placeholder="Introducción a los saltos"
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Próxima fase</label>
              <input
                value={rehabNext}
                onChange={e => setRehabNext(e.target.value)}
                placeholder="Vuelta al trote"
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
              />
            </div>
          </div>

          {/* Objetivos */}
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Objetivos</label>
            <ListEditor items={objectives} onChange={setObjectives} placeholder="Simetría de fuerza >70%" />
          </div>

          {/* Indicaciones clave */}
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Indicaciones clave</label>
            <ListEditor items={keyNotes} onChange={setKeyNotes} placeholder="Buscar RPE = 8/10" />
          </div>

          {/* Seguimiento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Seguimiento en casa</label>
              <textarea
                value={trackingHome}
                onChange={e => setTrackingHome(e.target.value)}
                rows={2}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Seguimiento en entrenamiento</label>
              <textarea
                value={trackingTraining}
                onChange={e => setTrackingTraining(e.target.value)}
                rows={2}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none"
              />
            </div>
          </div>

          {/* Recursos */}
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Recursos útiles</label>
            <ResourceEditor items={resources} onChange={setResources} />
          </div>

          <button
            onClick={save}
            disabled={pending}
            className="rounded-md bg-[var(--accent-teal)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saved ? '✓ Guardado' : pending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}
