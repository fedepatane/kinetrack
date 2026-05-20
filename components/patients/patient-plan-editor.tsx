'use client'

import { useState, useTransition } from 'react'
import { updatePatientPlan } from '@/lib/db/actions/patients'
import { Plus, Trash2 } from 'lucide-react'
import type { Patient } from '@/lib/db/types'

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }}
            placeholder={placeholder}
            className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-[var(--muted-foreground)] hover:text-red-500"><Trash2 className="size-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])}
        className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors">
        <Plus className="size-3" /> Agregar
      </button>
    </div>
  )
}

function ResourceEditor({ items, onChange }: { items: { label: string; url: string }[]; onChange: (v: { label: string; url: string }[]) => void }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item.label} onChange={e => { const n = [...items]; n[i] = { ...n[i], label: e.target.value }; onChange(n) }}
            placeholder="Título" className="w-28 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          <input value={item.url} onChange={e => { const n = [...items]; n[i] = { ...n[i], url: e.target.value }; onChange(n) }}
            placeholder="https://..." className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-[var(--muted-foreground)] hover:text-red-500"><Trash2 className="size-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { label: '', url: '' }])}
        className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors">
        <Plus className="size-3" /> Agregar recurso
      </button>
    </div>
  )
}

export function PatientPlanEditor({ patient }: { patient: Patient }) {
  const [, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [rehabCurrent, setRehabCurrent] = useState(patient.rehab_phase_current ?? '')
  const [rehabNext, setRehabNext] = useState(patient.rehab_phase_next ?? '')
  const [objectives, setObjectives] = useState<string[]>(JSON.parse(patient.objectives || '[]'))
  const [keyNotes, setKeyNotes] = useState<string[]>(JSON.parse(patient.key_notes || '[]'))
  const [trackingHome, setTrackingHome] = useState(patient.tracking_home ?? '')
  const [trackingTraining, setTrackingTraining] = useState(patient.tracking_training ?? '')
  const [resources, setResources] = useState<{ label: string; url: string }[]>(JSON.parse(patient.resources || '[]'))

  function save() {
    startTransition(async () => {
      await updatePatientPlan(patient.id, {
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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-5">

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Fase actual</label>
          <input value={rehabCurrent} onChange={e => setRehabCurrent(e.target.value)}
            placeholder="Introducción a los saltos"
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Próxima fase</label>
          <input value={rehabNext} onChange={e => setRehabNext(e.target.value)}
            placeholder="Vuelta al trote"
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Objetivos</label>
        <ListEditor items={objectives} onChange={setObjectives} placeholder="Simetría de fuerza >70%" />
      </div>

      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Indicaciones clave</label>
        <ListEditor items={keyNotes} onChange={setKeyNotes} placeholder="Buscar RPE = 8/10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Seguimiento en casa</label>
          <textarea value={trackingHome} onChange={e => setTrackingHome(e.target.value)} rows={2}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none" />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Seguimiento en entrenamiento</label>
          <textarea value={trackingTraining} onChange={e => setTrackingTraining(e.target.value)} rows={2}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">Recursos útiles</label>
        <ResourceEditor items={resources} onChange={setResources} />
      </div>

      <button onClick={save}
        className="rounded-md bg-[var(--accent-teal)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
        {saved ? '✓ Guardado' : 'Guardar'}
      </button>
    </div>
  )
}
