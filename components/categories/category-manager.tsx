'use client'

import { useState, useEffect, useMemo, useRef, useTransition } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, ChevronLeft, GripVertical, ArrowUp, ArrowDown, Search } from 'lucide-react'
import {
  createCategory, renameCategory, deleteCategory, assignCategory, reorderCategories, setCategoryColor
} from '@/lib/db/actions/categories'
import { CATEGORY_COLORS } from '@/lib/utils'
import type { CategoryWithSubs } from '@/lib/db/queries/categories'
import type { ExerciseWithCategory } from '@/lib/db/queries/exercises'

const TOP_SCOPE = '__top__'

function arrayMove<T extends { id: string }>(list: T[], fromId: string, toId: string): T[] {
  const from = list.findIndex(x => x.id === fromId)
  const to = list.findIndex(x => x.id === toId)
  if (from === -1 || to === -1 || from === to) return list
  const copy = [...list]
  const [moved] = copy.splice(from, 1)
  copy.splice(to, 0, moved)
  return copy
}

function ColorPicker({ id, color }: { id: string; color: string | null }) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function pick(c: string | null) {
    startTransition(() => setCategoryColor(id, c))
    setOpen(false)
  }

  return (
    <div className="relative shrink-0"
      onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
      onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current) }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Color de la categoría"
        className="block size-4 rounded-full border border-[var(--border)] hover:ring-2 hover:ring-[var(--accent-teal)]/40 transition-all"
        style={color ? { backgroundColor: color } : undefined}
      >
        {!color && <span className="block size-full rounded-full bg-[var(--muted)]" />}
      </button>
      {open && (
        <div className="absolute z-30 left-0 mt-1 w-40 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {CATEGORY_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => pick(c)}
                className={`size-5 rounded-full border transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-[var(--foreground)]' : 'border-[var(--border)]'}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="mt-2 w-full text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-left"
          >
            Sin color
          </button>
        </div>
      )}
    </div>
  )
}

function InlineInput({
  defaultValue = '',
  placeholder,
  onSave,
  onCancel,
}: {
  defaultValue?: string
  placeholder: string
  onSave: (v: string) => void
  onCancel: () => void
}) {
  const [val, setVal] = useState(defaultValue)
  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && val.trim()) onSave(val)
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="text-sm border border-[var(--accent-teal)] rounded px-2 py-0.5 bg-[var(--background)] focus:outline-none w-40"
      />
      <button onClick={() => val.trim() && onSave(val)} className="text-[var(--accent-teal)] hover:opacity-70">
        <Check className="size-3.5" />
      </button>
      <button onClick={onCancel} className="text-[var(--muted-foreground)] hover:opacity-70">
        <X className="size-3.5" />
      </button>
    </div>
  )
}

function ExerciseRow({
  exercise,
  categories,
}: {
  exercise: ExerciseWithCategory
  categories: CategoryWithSubs[]
}) {
  const [, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-[var(--muted)] group">
      <span className="text-sm">{exercise.name}</span>
      <select
        value={exercise.category_id ?? ''}
        onChange={e => startTransition(() => assignCategory(exercise.id, e.target.value || null))}
        className="text-xs border border-[var(--border)] rounded px-2 py-0.5 bg-[var(--background)] focus:outline-none focus:border-[var(--accent-teal)] text-[var(--muted-foreground)]"
      >
        <option value="">Sin categoría</option>
        {categories.map(cat => (
          <optgroup key={cat.id} label={cat.name}>
            {cat.subcategories.length > 0
              ? cat.subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))
              : <option value={cat.id}>{cat.name}</option>
            }
          </optgroup>
        ))}
      </select>
    </div>
  )
}

// Normaliza para buscar sin distinguir mayúsculas ni acentos
function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const PAGE_SIZE = 25

function ExerciseAssigner({
  exercises,
  categories,
}: {
  exercises: ExerciseWithCategory[]
  categories: CategoryWithSubs[]
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return exercises
    return exercises.filter(e => normalize(e.name).includes(q))
  }, [exercises, query])

  // Volver a la primera página al cambiar la búsqueda
  useEffect(() => { setPage(0) }, [query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const slice = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-sm font-medium">Asignar ejercicios</h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {filtered.length} {filtered.length === 1 ? 'ejercicio' : 'ejercicios'}
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)] pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-[var(--accent-teal)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] bg-[var(--card)]">
        {slice.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] p-4 text-center italic">Sin resultados.</p>
        ) : (
          slice.map(ex => <ExerciseRow key={ex.id} exercise={ex} categories={categories} />)
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={current === 0}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="size-4" /> Anterior
          </button>
          <span className="text-xs text-[var(--muted-foreground)]">Página {current + 1} de {pageCount}</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={current >= pageCount - 1}
            className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:pointer-events-none"
          >
            Siguiente <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export function CategoryManager({
  categories,
  exercises,
}: {
  categories: CategoryWithSubs[]
  exercises: ExerciseWithCategory[]
}) {
  // Copia local para previsualizar el reordenamiento mientras se arrastra.
  const [cats, setCats] = useState(categories)
  useEffect(() => { setCats(categories) }, [categories])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [addingTop, setAddingTop] = useState(false)
  const [addingSub, setAddingSub] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Item que se está arrastrando: { id, scope } — scope es TOP_SCOPE o el id del padre.
  const drag = useRef<{ id: string; scope: string } | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const exCount = (catId: string) =>
    exercises.filter(e => e.category_id === catId).length

  function handleDragStart(id: string, scope: string) {
    drag.current = { id, scope }
    setDragId(id)
  }

  function handleDragOver(e: React.DragEvent, overId: string, scope: string) {
    const d = drag.current
    if (!d || d.scope !== scope || d.id === overId) return
    e.preventDefault()
    if (scope === TOP_SCOPE) {
      setCats(prev => arrayMove(prev, d.id, overId))
    } else {
      setCats(prev => prev.map(c =>
        c.id === scope ? { ...c, subcategories: arrayMove(c.subcategories, d.id, overId) } : c
      ))
    }
  }

  function handleDragEnd() {
    const d = drag.current
    drag.current = null
    setDragId(null)
    if (!d) return
    if (d.scope === TOP_SCOPE) {
      const ids = cats.map(c => c.id)
      startTransition(() => reorderCategories(ids))
    } else {
      const parent = cats.find(c => c.id === d.scope)
      if (parent) {
        const ids = parent.subcategories.map(s => s.id)
        startTransition(() => reorderCategories(ids))
      }
    }
  }

  // Reordenar con flechas (alternativa táctil para móvil)
  function moveCat(index: number, dir: -1 | 1) {
    const to = index + dir
    if (to < 0 || to >= cats.length) return
    const next = [...cats]
    ;[next[index], next[to]] = [next[to], next[index]]
    setCats(next)
    startTransition(() => reorderCategories(next.map(c => c.id)))
  }

  function moveSub(parentId: string, index: number, dir: -1 | 1) {
    const parent = cats.find(c => c.id === parentId)
    if (!parent) return
    const to = index + dir
    if (to < 0 || to >= parent.subcategories.length) return
    const subs = [...parent.subcategories]
    ;[subs[index], subs[to]] = [subs[to], subs[index]]
    setCats(prev => prev.map(c => c.id === parentId ? { ...c, subcategories: subs } : c))
    startTransition(() => reorderCategories(subs.map(s => s.id)))
  }

  function MoveArrows({ onUp, onDown, isFirst, isLast }: { onUp: () => void; onDown: () => void; isFirst: boolean; isLast: boolean }) {
    return (
      <div className="flex flex-col md:hidden shrink-0">
        <button type="button" onClick={onUp} disabled={isFirst} aria-label="Subir"
          className="text-[var(--muted-foreground)] disabled:opacity-25 -my-0.5"><ArrowUp className="size-3.5" /></button>
        <button type="button" onClick={onDown} disabled={isLast} aria-label="Bajar"
          className="text-[var(--muted-foreground)] disabled:opacity-25 -my-0.5"><ArrowDown className="size-3.5" /></button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Lista de categorías */}
      <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {cats.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)] p-4 text-center italic">
            Sin categorías todavía.
          </p>
        )}

        {cats.map((cat, ci) => (
          <div key={cat.id}>
            {/* Fila categoría */}
            <div
              draggable={editing !== cat.id}
              onDragStart={() => handleDragStart(cat.id, TOP_SCOPE)}
              onDragOver={e => handleDragOver(e, cat.id, TOP_SCOPE)}
              onDrop={e => e.preventDefault()}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 px-4 py-3 bg-[var(--card)] group ${dragId === cat.id ? 'opacity-50' : ''}`}
            >
              <MoveArrows onUp={() => moveCat(ci, -1)} onDown={() => moveCat(ci, 1)} isFirst={ci === 0} isLast={ci === cats.length - 1} />
              <GripVertical className="hidden md:block size-3.5 text-[var(--muted-foreground)] cursor-grab active:cursor-grabbing shrink-0" />
              <button onClick={() => toggle(cat.id)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                {expanded[cat.id] ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>

              <ColorPicker id={cat.id} color={cat.color} />

              {editing === cat.id ? (
                <InlineInput
                  defaultValue={cat.name}
                  placeholder="Nombre de categoría"
                  onSave={v => { startTransition(() => renameCategory(cat.id, v)); setEditing(null) }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <span className="text-sm font-medium flex-1">{cat.name}</span>
              )}

              <span className="text-xs text-[var(--muted-foreground)]">
                {cat.subcategories.length > 0
                  ? `${cat.subcategories.length} subcategorías`
                  : `${exCount(cat.id)} ejercicios`}
              </span>

              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(cat.id)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  onClick={() => startTransition(() => deleteCategory(cat.id))}
                  className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>

            {/* Subcategorías */}
            {expanded[cat.id] && (
              <div className="bg-[var(--muted)]/40">
                {cat.subcategories.map((sub, si) => (
                  <div
                    key={sub.id}
                    draggable={editing !== sub.id}
                    onDragStart={e => { e.stopPropagation(); handleDragStart(sub.id, cat.id) }}
                    onDragOver={e => handleDragOver(e, sub.id, cat.id)}
                    onDrop={e => e.preventDefault()}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 pl-6 pr-4 py-2 border-t border-[var(--border)] group ${dragId === sub.id ? 'opacity-50' : ''}`}
                  >
                    <MoveArrows onUp={() => moveSub(cat.id, si, -1)} onDown={() => moveSub(cat.id, si, 1)} isFirst={si === 0} isLast={si === cat.subcategories.length - 1} />
                    <GripVertical className="hidden md:block size-3.5 text-[var(--muted-foreground)] cursor-grab active:cursor-grabbing shrink-0" />
                    {editing === sub.id ? (
                      <InlineInput
                        defaultValue={sub.name}
                        placeholder="Nombre de subcategoría"
                        onSave={v => { startTransition(() => renameCategory(sub.id, v)); setEditing(null) }}
                        onCancel={() => setEditing(null)}
                      />
                    ) : (
                      <span className="text-sm flex-1">{sub.name}</span>
                    )}
                    <span className="text-xs text-[var(--muted-foreground)]">{exCount(sub.id)} ejercicios</span>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing(sub.id)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => startTransition(() => deleteCategory(sub.id))} className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Agregar subcategoría */}
                <div className="pl-10 pr-4 py-2 border-t border-[var(--border)]">
                  {addingSub === cat.id ? (
                    <InlineInput
                      placeholder="Nueva subcategoría"
                      onSave={v => { startTransition(() => createCategory(v, cat.id)); setAddingSub(null) }}
                      onCancel={() => setAddingSub(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingSub(cat.id)}
                      className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors"
                    >
                      <Plus className="size-3" />
                      Agregar subcategoría
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Agregar categoría */}
        <div className="px-4 py-3 bg-[var(--card)]">
          {addingTop ? (
            <InlineInput
              placeholder="Nueva categoría"
              onSave={v => { startTransition(() => createCategory(v, null)); setAddingTop(false) }}
              onCancel={() => setAddingTop(false)}
            />
          ) : (
            <button
              onClick={() => setAddingTop(true)}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors"
            >
              <Plus className="size-3.5" />
              Nueva categoría
            </button>
          )}
        </div>
      </div>

      {/* Asignar ejercicios */}
      {exercises.length > 0 && (
        <ExerciseAssigner exercises={exercises} categories={categories} />
      )}
    </div>
  )
}
