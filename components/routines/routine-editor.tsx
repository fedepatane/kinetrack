'use client'

import { useState } from 'react'
import { createRoutine, updateRoutine } from '@/lib/db/actions/routines'
import { createExerciseInline } from '@/lib/db/actions/exercises'
import type { Exercise } from '@/lib/db/types'
import type { RoutineWithBlocks } from '@/lib/db/queries/routines'
import type { CategoryWithSubs } from '@/lib/db/queries/categories'
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { TagInput } from './tag-input'
import { resolveMedia } from '@/lib/utils'
import { MediaLauncher } from '@/components/patient-view/media-launcher'
import Image from 'next/image'

type BEForm = {
  exercise_id: string; order_index: number
  sets: string; reps: string; reps_max: string; duration_seconds: string; rest_seconds: string
  intensity_type: 'rpe' | 'rir' | '1rm' | ''; intensity_value: string
  per_side: boolean
  notes: string
}
type BlockForm = { name: string; order_index: number; notes: string; exercises: BEForm[]; open: boolean }
type DayForm   = { name: string; order_index: number; blocks: BlockForm[]; open: boolean }

const emptyBE    = (i: number): BEForm    => ({ exercise_id: '', order_index: i, sets: '', reps: '', reps_max: '', duration_seconds: '', rest_seconds: '', intensity_type: '', intensity_value: '', per_side: false, notes: '' })
const emptyBlock = (i: number): BlockForm => ({ name: '', order_index: i, notes: '', exercises: [], open: true })
const emptyDay   = (i: number): DayForm   => ({ name: `Día ${i + 1}`, order_index: i, blocks: [], open: true })

function beFromRow(be: RoutineWithBlocks['blocks'][0]['block_exercises'][0], i: number): BEForm {
  return {
    exercise_id: be.exercise_id,
    order_index: i,
    sets: be.sets?.toString() ?? '',
    reps: be.reps?.toString() ?? '',
    reps_max: be.reps_max?.toString() ?? '',
    duration_seconds: be.duration_seconds?.toString() ?? '',
    rest_seconds: be.rest_seconds?.toString() ?? '',
    intensity_type: be.intensity_type ?? '',
    intensity_value: be.intensity_value?.toString() ?? '',
    per_side: be.per_side === 1,
    notes: be.notes ?? '',
  }
}

function blockFromRow(b: RoutineWithBlocks['blocks'][0], i: number): BlockForm {
  return {
    name: b.name,
    order_index: i,
    notes: b.notes ?? '',
    exercises: [...b.block_exercises].sort((a, c) => a.order_index - c.order_index).map(beFromRow),
    open: true,
  }
}

function ExercisePicker({
  value, onChange, exercises, categories, onExerciseCreated,
}: {
  value: string
  onChange: (id: string) => void
  exercises: Exercise[]
  categories: CategoryWithSubs[]
  onExerciseCreated: (ex: Exercise) => void
}) {
  const [selectedCat, setSelectedCat] = useState('')
  const [selectedSub, setSelectedSub] = useState('')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  // Si ya hay ejercicio elegido, arranca mostrando la tarjeta (no el selector)
  const [editing, setEditing] = useState(!value)

  const activeCat = categories.find(c => c.id === selectedCat)
  const selected = exercises.find(e => e.id === value) ?? null

  // Vista compacta (tipo tarjeta) cuando ya hay un ejercicio elegido
  if (!editing && selected) {
    const media = resolveMedia(selected.video_url, selected.thumbnail_url)
    const cat = selected as Exercise & { parent_category?: { color: string | null } | null; category?: { color: string | null } | null }
    const color = cat.parent_category?.color ?? cat.category?.color ?? null
    return (
      <div className="flex-1 flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
        style={color ? { borderLeftColor: color, borderLeftWidth: 4 } : undefined}>
        <div className="w-20 h-12 rounded overflow-hidden bg-[var(--muted)] flex-shrink-0 relative">
          {media ? (
            <MediaLauncher media={media} title={selected.name}>
              <button type="button" className="absolute inset-0 w-full h-full cursor-pointer">
                {media.thumb && <Image src={media.thumb} alt={selected.name} width={80} height={48} className="object-cover w-full h-full" />}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
                  <span className="text-white/80 text-sm drop-shadow">{media.mode === 'image' ? '⤢' : '▶'}</span>
                </div>
              </button>
            </MediaLauncher>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--muted-foreground)]">Sin video</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selected.name}</p>
          {selected.description && (
            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{selected.description}</p>
          )}
        </div>
        <button type="button" onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors flex-shrink-0">
          <Pencil className="size-3" /> Cambiar
        </button>
      </div>
    )
  }

  const filtered = exercises.filter(ex => {
    const exCat = (ex as Exercise & { category_id?: string | null }).category_id
    if (selectedSub && exCat !== selectedSub) return false
    if (!selectedSub && selectedCat) {
      const childIds = activeCat?.subcategories.map(s => s.id) ?? []
      if (exCat !== selectedCat && !childIds.includes(exCat ?? '')) return false
    }
    if (search.trim()) {
      return ex.name.toLowerCase().includes(search.trim().toLowerCase())
    }
    return true
  })

  function handleCatChange(id: string) {
    setSelectedCat(id)
    setSelectedSub('')
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    const ex = await createExerciseInline({
      name: newName,
      description: newDesc || undefined,
      video_url: newUrl || undefined,
      category_id: selectedSub || selectedCat || null,
    })
    onExerciseCreated(ex as unknown as Exercise)
    onChange(ex.id)
    setCreating(false)
    setEditing(false)
    setNewName(''); setNewDesc(''); setNewUrl('')
    setSaving(false)
  }

  return (
    <div className="flex-1 space-y-1.5">
      {categories.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <select value={selectedCat} onChange={e => handleCatChange(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {activeCat && activeCat.subcategories.length > 0 && (
            <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)}
              className="rounded border border-[var(--accent-teal)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--accent-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]">
              <option value="">Todas</option>
              {activeCat.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar ejercicio..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
      />

      <select value={value} onChange={e => { onChange(e.target.value); if (e.target.value) setEditing(false) }} required
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]">
        <option value="">Seleccionar ejercicio...</option>
        {filtered.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
      </select>

      {/* Crear ejercicio inline */}
      {!creating ? (
        <button type="button" onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors">
          <Plus className="size-3" /> Crear ejercicio nuevo
        </button>
      ) : (
        <div className="rounded-lg border border-[var(--accent-teal)] bg-[var(--muted)]/40 p-3 space-y-2">
          <p className="text-xs font-medium text-[var(--accent-teal)]">Nuevo ejercicio</p>
          <input
            type="text"
            placeholder="Nombre *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
          <input
            type="url"
            placeholder="URL del video (opcional) — YouTube, Vimeo, .mp4…"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          />
          <div className="flex gap-2">
            <button type="button" onClick={handleCreate} disabled={!newName.trim() || saving}
              className="rounded bg-[var(--accent-teal)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Guardando...' : 'Crear y seleccionar'}
            </button>
            <button type="button" onClick={() => { setCreating(false); setNewName(''); setNewDesc(''); setNewUrl('') }}
              className="rounded border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BlockEditor({
  block, blockIdx, exercises, categories, onUpdate, onRemove, onAddBE, onRemoveBE, onUpdateBE, onExerciseCreated,
}: {
  block: BlockForm; blockIdx: number; exercises: Exercise[]; categories: CategoryWithSubs[]
  onUpdate: (p: Partial<BlockForm>) => void; onRemove: () => void
  onAddBE: () => void; onRemoveBE: (i: number) => void; onUpdateBE: (i: number, p: Partial<BEForm>) => void
  onExerciseCreated: (ex: Exercise) => void
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--border)]">
        <span className="flex items-center justify-center size-5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] text-[11px] font-semibold shrink-0">B{blockIdx + 1}</span>
        <input type="text" placeholder={`Nombre del bloque (ej. Entrada en calor)`} value={block.name}
          onChange={e => onUpdate({ name: e.target.value })} required
          className="flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder:text-[var(--muted-foreground)] placeholder:font-normal" />
        <button type="button" onClick={() => onUpdate({ open: !block.open })} title={block.open ? 'Contraer' : 'Expandir'} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {block.open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <button type="button" onClick={onRemove} title="Quitar bloque" className="text-[var(--muted-foreground)] hover:text-red-500"><Trash2 className="size-4" /></button>
      </div>
      {block.open && (
        <div className="p-3 space-y-2">
          {block.exercises.length === 0 && (
            <p className="text-xs text-[var(--muted-foreground)] italic px-1 py-2">Todavía no agregaste ejercicios a este bloque.</p>
          )}
          {block.exercises.map((be, bei) => (
            <div key={bei} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
                  <span className="flex items-center justify-center size-5 rounded-full bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] text-[11px]">{bei + 1}</span>
                  Ejercicio
                </span>
                <button type="button" onClick={() => onRemoveBE(bei)} title="Quitar ejercicio" className="text-[var(--muted-foreground)] hover:text-red-500 flex-shrink-0"><Trash2 className="size-3.5" /></button>
              </div>

              <ExercisePicker
                value={be.exercise_id}
                onChange={id => onUpdateBE(bei, { exercise_id: id })}
                exercises={exercises}
                categories={categories}
                onExerciseCreated={onExerciseCreated}
              />

              {/* Dosificación */}
              <div className="rounded-md bg-[var(--muted)]/40 p-2.5 space-y-2.5">
                <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Dosificación</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Series</label>
                    <input type="number" min="0" value={be.sets} placeholder="—"
                      onChange={e => onUpdateBE(bei, { sets: e.target.value })}
                      className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Reps {be.reps_max && '(mín)'}</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" value={be.reps} placeholder="—"
                        onChange={e => onUpdateBE(bei, { reps: e.target.value })}
                        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
                      <span className="text-xs text-[var(--muted-foreground)]">a</span>
                      <input type="number" min="0" value={be.reps_max} placeholder="máx"
                        onChange={e => onUpdateBE(bei, { reps_max: e.target.value })}
                        title="Reps máximas (para un rango, ej. 8 a 12)"
                        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Duración (s)</label>
                    <input type="number" min="0" value={be.duration_seconds} placeholder="—"
                      onChange={e => onUpdateBE(bei, { duration_seconds: e.target.value })}
                      className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Descanso (s)</label>
                    <input type="number" min="0" value={be.rest_seconds} placeholder="—"
                      onChange={e => onUpdateBE(bei, { rest_seconds: e.target.value })}
                      className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
                  </div>
                </div>

                {/* Por lado + intensidad */}
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-[var(--foreground)] cursor-pointer pb-1.5 shrink-0">
                    <input type="checkbox" checked={be.per_side}
                      onChange={e => onUpdateBE(bei, { per_side: e.target.checked })}
                      className="accent-[var(--accent-teal)]" />
                    Por lado
                  </label>
                  <div>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">Intensidad</label>
                    <select
                      value={be.intensity_type}
                      onChange={e => onUpdateBE(bei, { intensity_type: e.target.value as BEForm['intensity_type'], intensity_value: '' })}
                      className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
                    >
                      <option value="">—</option>
                      <option value="rpe">RPE (1–10)</option>
                      <option value="rir">RIR (0–5)</option>
                      <option value="1rm">% 1RM</option>
                    </select>
                  </div>
                  {be.intensity_type && (
                    <div className="w-[90px]">
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                        {be.intensity_type === 'rpe' ? 'Valor' : be.intensity_type === 'rir' ? 'Valor' : '%'}
                      </label>
                      {be.intensity_type === '1rm' ? (
                        <select
                          value={be.intensity_value}
                          onChange={e => onUpdateBE(bei, { intensity_value: e.target.value })}
                          className="w-full rounded border border-[var(--accent-teal)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
                        >
                          <option value="">—</option>
                          {Array.from({ length: 11 }, (_, i) => i * 10).map(pct => (
                            <option key={pct} value={pct}>{pct}%</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          min={be.intensity_type === 'rir' ? 0 : 1}
                          max={be.intensity_type === 'rpe' ? 10 : 5}
                          step={1}
                          value={be.intensity_value}
                          onChange={e => onUpdateBE(bei, { intensity_value: e.target.value })}
                          className="w-full rounded border border-[var(--accent-teal)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Nota de dosificación */}
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Nota de dosificación</label>
                  <input type="text" value={be.notes}
                    onChange={e => onUpdateBE(bei, { notes: e.target.value })}
                    placeholder="Texto libre. Si lo completás solo, es la dosificación final."
                    title="Se muestra en la dosificación. Si no completás los otros campos, este texto es la prescripción."
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={onAddBE}
            className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border)] py-2 text-xs text-[var(--muted-foreground)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
            <Plus className="size-3.5" /> Agregar ejercicio
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  exercises: Exercise[]
  categories?: CategoryWithSubs[]
  allTags?: string[]
  initialData?: RoutineWithBlocks
}

export function RoutineEditor({ exercises: initialExercises, categories = [], allTags = [], initialData }: Props) {
  const isEdit = !!initialData
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])

  function handleExerciseCreated(ex: Exercise) {
    setExercises(prev => [...prev, ex])
  }

  const [useDays, setUseDays] = useState(isEdit ? initialData.days.length > 0 : false)

  const [days, setDays] = useState<DayForm[]>(() =>
    isEdit
      ? [...initialData.days]
          .sort((a, b) => a.order_index - b.order_index)
          .map((d, i) => ({
            name: d.name,
            order_index: i,
            open: true,
            blocks: [...d.blocks].sort((a, b) => a.order_index - b.order_index).map(blockFromRow),
          }))
      : []
  )

  const [blocks, setBlocks] = useState<BlockForm[]>(() =>
    isEdit
      ? [...initialData.blocks].sort((a, b) => a.order_index - b.order_index).map(blockFromRow)
      : []
  )

  const [pending, setPending] = useState(false)
  const [error, setError]     = useState('')

  // ── helpers días ──
  const updDay = (di: number, p: Partial<DayForm>) => setDays(ds => ds.map((d, i) => i === di ? { ...d, ...p } : d))
  const addDay = () => setDays(ds => [...ds, emptyDay(ds.length)])
  const removeDay = (di: number) => setDays(ds => ds.filter((_, i) => i !== di).map((d, i) => ({ ...d, order_index: i })))

  const addBlockToDay    = (di: number) => updDay(di, { blocks: [...days[di].blocks, emptyBlock(days[di].blocks.length)] })
  const updBlockInDay    = (di: number, bi: number, p: Partial<BlockForm>) =>
    updDay(di, { blocks: days[di].blocks.map((b, i) => i === bi ? { ...b, ...p } : b) })
  const removeBlockFromDay = (di: number, bi: number) =>
    updDay(di, { blocks: days[di].blocks.filter((_, i) => i !== bi).map((b, i) => ({ ...b, order_index: i })) })
  const addBEToDay    = (di: number, bi: number) =>
    updDay(di, { blocks: days[di].blocks.map((b, i) => i === bi ? { ...b, exercises: [...b.exercises, emptyBE(b.exercises.length)] } : b) })
  const updBEInDay    = (di: number, bi: number, bei: number, p: Partial<BEForm>) =>
    updDay(di, { blocks: days[di].blocks.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((be, j) => j === bei ? { ...be, ...p } : be) } : b) })
  const removeBEFromDay = (di: number, bi: number, bei: number) =>
    updDay(di, { blocks: days[di].blocks.map((b, i) => i === bi ? { ...b, exercises: b.exercises.filter((_, j) => j !== bei).map((be, j) => ({ ...be, order_index: j })) } : b) })

  // ── helpers bloques sin días ──
  const updBlock  = (bi: number, p: Partial<BlockForm>) => setBlocks(bs => bs.map((b, i) => i === bi ? { ...b, ...p } : b))
  const addBE     = (bi: number) => setBlocks(bs => bs.map((b, i) => i === bi ? { ...b, exercises: [...b.exercises, emptyBE(b.exercises.length)] } : b))
  const updBE     = (bi: number, bei: number, p: Partial<BEForm>) =>
    setBlocks(bs => bs.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((be, j) => j === bei ? { ...be, ...p } : be) } : b))
  const removeBE  = (bi: number, bei: number) =>
    setBlocks(bs => bs.map((b, i) => i === bi ? { ...b, exercises: b.exercises.filter((_, j) => j !== bei).map((be, j) => ({ ...be, order_index: j })) } : b))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true); setError('')
    const fd = new FormData(e.currentTarget)

    const mapBE = (be: BEForm, bei: number) => ({
      exercise_id: be.exercise_id, order_index: bei,
      sets: be.sets ? Number(be.sets) : undefined,
      reps: be.reps ? Number(be.reps) : undefined,
      reps_max: be.reps_max ? Number(be.reps_max) : undefined,
      duration_seconds: be.duration_seconds ? Number(be.duration_seconds) : undefined,
      rest_seconds: be.rest_seconds ? Number(be.rest_seconds) : undefined,
      intensity_type: be.intensity_type || undefined,
      intensity_value: be.intensity_value ? Number(be.intensity_value) : undefined,
      per_side: be.per_side || undefined,
      notes: be.notes || undefined,
    })
    const mapBlock = (b: BlockForm, bi: number) => ({
      name: b.name, order_index: bi, notes: b.notes || undefined,
      exercises: b.exercises.map(mapBE),
    })

    const payload = {
      name: fd.get('name'),
      description: fd.get('description') || undefined,
      estimated_minutes: fd.get('estimated_minutes') ? Number(fd.get('estimated_minutes')) : undefined,
      tags,
      days: useDays ? days.map((d, di) => ({ name: d.name, order_index: di, blocks: d.blocks.map(mapBlock) })) : [],
      blocks: !useDays ? blocks.map(mapBlock) : [],
    }

    const result = isEdit
      ? await updateRoutine(initialData.id, payload)
      : await createRoutine(payload)

    if (result?.error) { setError(result.error); setPending(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos básicos */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
        <h2 className="text-sm font-semibold">Datos de la rutina</h2>
        <div>
          <label className="block text-sm mb-1.5">Nombre</label>
          <input name="name" type="text" required defaultValue={initialData?.name}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Descripción</label>
          <textarea name="description" rows={2} defaultValue={initialData?.description ?? ''}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1.5">Duración (min)</label>
            <input name="estimated_minutes" type="number" min="1" defaultValue={initialData?.estimated_minutes ?? ''}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1.5">Tags</label>
          <TagInput value={tags} onChange={setTags} suggestions={allTags} />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Escribí y elegí un tag existente o creá uno nuevo. Sirven para organizar y buscar rutinas.</p>
        </div>
      </div>

      {/* Estructura */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="text-sm font-semibold">Estructura</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {useDays ? 'La rutina se divide en días (Día 1, Día 2…), cada uno con sus bloques.' : 'La rutina es un solo plan organizado en bloques.'}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <span className="text-xs text-[var(--muted-foreground)]">Varios días</span>
          <button type="button" onClick={() => setUseDays(v => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useDays ? 'bg-[var(--accent-teal)]' : 'bg-[var(--muted)]'}`}>
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${useDays ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>

      {/* Editor con días */}
      {useDays ? (
        <div className="space-y-4">
          {days.map((day, di) => (
            <div key={di} className="rounded-lg border-2 border-[var(--border)] overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--muted)] border-b border-[var(--border)]">
                <span className="flex items-center justify-center size-6 rounded-full bg-[var(--accent-teal)] text-white text-xs font-semibold shrink-0">{di + 1}</span>
                <input value={day.name} onChange={e => updDay(di, { name: e.target.value })} required
                  placeholder={`Día ${di + 1}`}
                  className="flex-1 bg-transparent text-sm font-semibold focus:outline-none placeholder:text-[var(--muted-foreground)] placeholder:font-normal" />
                <button type="button" onClick={() => updDay(di, { open: !day.open })} title={day.open ? 'Contraer' : 'Expandir'} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  {day.open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                <button type="button" onClick={() => removeDay(di)} title="Quitar día" className="text-[var(--muted-foreground)] hover:text-red-500"><Trash2 className="size-4" /></button>
              </div>
              {day.open && (
                <div className="p-4 space-y-3">
                  {day.blocks.length === 0 && (
                    <p className="text-xs text-[var(--muted-foreground)] italic">Agregá un bloque para empezar a cargar ejercicios.</p>
                  )}
                  {day.blocks.map((block, bi) => (
                    <BlockEditor key={bi} block={block} blockIdx={bi} exercises={exercises} categories={categories}
                      onUpdate={p => updBlockInDay(di, bi, p)}
                      onRemove={() => removeBlockFromDay(di, bi)}
                      onAddBE={() => addBEToDay(di, bi)}
                      onRemoveBE={bei => removeBEFromDay(di, bi, bei)}
                      onUpdateBE={(bei, p) => updBEInDay(di, bi, bei, p)}
                      onExerciseCreated={handleExerciseCreated}
                    />
                  ))}
                  <button type="button" onClick={() => addBlockToDay(di)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border)] py-2 text-xs text-[var(--muted-foreground)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
                    <Plus className="size-3.5" /> Agregar bloque
                  </button>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={addDay}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-3 text-sm font-medium text-[var(--muted-foreground)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
            <Plus className="size-4" /> Agregar día
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.length === 0 && (
            <p className="text-xs text-[var(--muted-foreground)] italic">Agregá un bloque para empezar a cargar ejercicios.</p>
          )}
          {blocks.map((block, bi) => (
            <BlockEditor key={bi} block={block} blockIdx={bi} exercises={exercises} categories={categories}
              onUpdate={p => updBlock(bi, p)}
              onRemove={() => setBlocks(bs => bs.filter((_, i) => i !== bi).map((b, i) => ({ ...b, order_index: i })))}
              onAddBE={() => addBE(bi)}
              onRemoveBE={bei => removeBE(bi, bei)}
              onUpdateBE={(bei, p) => updBE(bi, bei, p)}
              onExerciseCreated={handleExerciseCreated}
            />
          ))}
          <button type="button" onClick={() => setBlocks(bs => [...bs, emptyBlock(bs.length)])}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-3 text-sm font-medium text-[var(--muted-foreground)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
            <Plus className="size-4" /> Agregar bloque
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end border-t border-[var(--border)] pt-4">
        <button type="submit" disabled={pending}
          className="rounded-md bg-[var(--accent-teal)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
          {pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear rutina'}
        </button>
      </div>
    </form>
  )
}
