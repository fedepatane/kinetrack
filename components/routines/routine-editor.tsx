'use client'

import { useState } from 'react'
import { createRoutine, updateRoutine } from '@/lib/db/actions/routines'
import { createExerciseInline } from '@/lib/db/actions/exercises'
import type { Exercise } from '@/lib/db/types'
import type { RoutineWithBlocks } from '@/lib/db/queries/routines'
import type { CategoryWithSubs } from '@/lib/db/queries/categories'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type BEForm = {
  exercise_id: string; order_index: number
  sets: string; reps: string; duration_seconds: string; rest_seconds: string
  intensity_type: 'rpe' | 'rir' | '1rm' | ''; intensity_value: string
  notes: string
}
type BlockForm = { name: string; order_index: number; notes: string; exercises: BEForm[]; open: boolean }
type DayForm   = { name: string; order_index: number; blocks: BlockForm[]; open: boolean }

const emptyBE    = (i: number): BEForm    => ({ exercise_id: '', order_index: i, sets: '', reps: '', duration_seconds: '', rest_seconds: '', intensity_type: '', intensity_value: '', notes: '' })
const emptyBlock = (i: number): BlockForm => ({ name: '', order_index: i, notes: '', exercises: [], open: true })
const emptyDay   = (i: number): DayForm   => ({ name: `Día ${String.fromCharCode(65 + i)}`, order_index: i, blocks: [], open: true })

function beFromRow(be: RoutineWithBlocks['blocks'][0]['block_exercises'][0], i: number): BEForm {
  return {
    exercise_id: be.exercise_id,
    order_index: i,
    sets: be.sets?.toString() ?? '',
    reps: be.reps?.toString() ?? '',
    duration_seconds: be.duration_seconds?.toString() ?? '',
    rest_seconds: be.rest_seconds?.toString() ?? '',
    intensity_type: be.intensity_type ?? '',
    intensity_value: be.intensity_value?.toString() ?? '',
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

  const activeCat = categories.find(c => c.id === selectedCat)

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

      <select value={value} onChange={e => onChange(e.target.value)} required
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
            placeholder="URL de YouTube (opcional)"
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
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)]">
        <input type="text" placeholder={`Bloque ${blockIdx + 1}`} value={block.name}
          onChange={e => onUpdate({ name: e.target.value })} required
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--muted-foreground)]" />
        <button type="button" onClick={() => onUpdate({ open: !block.open })} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {block.open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <button type="button" onClick={onRemove} className="text-[var(--muted-foreground)] hover:text-red-500"><Trash2 className="size-4" /></button>
      </div>
      {block.open && (
        <div className="p-3 space-y-2">
          {block.exercises.map((be, bei) => (
            <div key={bei} className="rounded-md border border-[var(--border)] p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <ExercisePicker
                  value={be.exercise_id}
                  onChange={id => onUpdateBE(bei, { exercise_id: id })}
                  exercises={exercises}
                  categories={categories}
                  onExerciseCreated={onExerciseCreated}
                />
                <button type="button" onClick={() => onRemoveBE(bei)} className="text-[var(--muted-foreground)] hover:text-red-500 mt-1 flex-shrink-0"><Trash2 className="size-3.5" /></button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['sets', 'reps', 'duration_seconds', 'rest_seconds'] as const).map((field, fi) => (
                  <div key={field}>
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                      {['Series', 'Reps', 'Duración (s)', 'Descanso (s)'][fi]}
                    </label>
                    <input type="number" min="0" value={be[field]}
                      onChange={e => onUpdateBE(bei, { [field]: e.target.value })}
                      className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
                  </div>
                ))}
              </div>
              {/* Intensidad */}
              <div className="flex gap-2 items-end">
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
                  <div className="flex-1 max-w-[100px]">
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                      {be.intensity_type === 'rpe' ? 'Valor (1–10)' : be.intensity_type === 'rir' ? 'Valor (0–5)' : 'Valor (%)'}
                    </label>
                    <input
                      type="number"
                      min={be.intensity_type === 'rir' ? 0 : 1}
                      max={be.intensity_type === 'rpe' ? 10 : be.intensity_type === 'rir' ? 5 : 100}
                      step={be.intensity_type === '1rm' ? 5 : 1}
                      value={be.intensity_value}
                      onChange={e => onUpdateBE(bei, { intensity_value: e.target.value })}
                      className="w-full rounded border border-[var(--accent-teal)] bg-[var(--background)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={onAddBE} className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)]">
            <Plus className="size-3" /> Agregar ejercicio
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  exercises: Exercise[]
  categories?: CategoryWithSubs[]
  initialData?: RoutineWithBlocks
}

export function RoutineEditor({ exercises: initialExercises, categories = [], initialData }: Props) {
  const isEdit = !!initialData
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises)

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
      duration_seconds: be.duration_seconds ? Number(be.duration_seconds) : undefined,
      rest_seconds: be.rest_seconds ? Number(be.rest_seconds) : undefined,
      intensity_type: be.intensity_type || undefined,
      intensity_value: be.intensity_value ? Number(be.intensity_value) : undefined,
      notes: be.notes || undefined,
    })
    const mapBlock = (b: BlockForm, bi: number) => ({
      name: b.name, order_index: bi, notes: b.notes || undefined,
      exercises: b.exercises.map(mapBE),
    })

    const payload = {
      name: fd.get('name'),
      description: fd.get('description') || undefined,
      body_zone: fd.get('body_zone') || undefined,
      difficulty: fd.get('difficulty') || undefined,
      estimated_minutes: fd.get('estimated_minutes') ? Number(fd.get('estimated_minutes')) : undefined,
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
      <div className="space-y-4">
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1.5">Zona corporal</label>
            <input name="body_zone" type="text" defaultValue={initialData?.body_zone ?? ''}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          </div>
          <div>
            <label className="block text-sm mb-1.5">Dificultad</label>
            <select name="difficulty" defaultValue={initialData?.difficulty ?? ''}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]">
              <option value="">—</option>
              <option value="suave">Suave</option>
              <option value="moderado">Moderado</option>
              <option value="intenso">Intenso</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5">Duración (min)</label>
            <input name="estimated_minutes" type="number" min="1" defaultValue={initialData?.estimated_minutes ?? ''}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          </div>
        </div>
      </div>

      {/* Toggle días */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setUseDays(v => !v)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useDays ? 'bg-[var(--accent-teal)]' : 'bg-[var(--muted)]'}`}>
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${useDays ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
        <span className="text-sm text-[var(--muted-foreground)]">Rutina con varios días (Día A, Día B...)</span>
      </div>

      {/* Editor con días */}
      {useDays ? (
        <div className="space-y-4">
          {days.map((day, di) => (
            <div key={di} className="rounded-lg border-2 border-[var(--border)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--muted)] border-b border-[var(--border)]">
                <input value={day.name} onChange={e => updDay(di, { name: e.target.value })} required
                  className="flex-1 bg-transparent text-sm font-medium focus:outline-none" />
                <button type="button" onClick={() => updDay(di, { open: !day.open })} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  {day.open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                <button type="button" onClick={() => removeDay(di)} className="text-[var(--muted-foreground)] hover:text-red-500"><Trash2 className="size-4" /></button>
              </div>
              {day.open && (
                <div className="p-4 space-y-3">
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
                    className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)]">
                    <Plus className="size-3.5" /> Agregar bloque
                  </button>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={addDay}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors">
            <Plus className="size-4" /> Agregar día
          </button>
        </div>
      ) : (
        <div className="space-y-3">
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
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--accent-teal)]">
            <Plus className="size-4" /> Agregar bloque
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={pending}
        className="rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
        {pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear rutina'}
      </button>
    </form>
  )
}
