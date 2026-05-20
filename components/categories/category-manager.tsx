'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import {
  createCategory, renameCategory, deleteCategory, assignCategory
} from '@/lib/db/actions/categories'
import type { CategoryWithSubs } from '@/lib/db/queries/categories'
import type { ExerciseWithCategory } from '@/lib/db/queries/exercises'

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
  const allSubs = categories.flatMap(c => [c, ...c.subcategories])

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

export function CategoryManager({
  categories,
  exercises,
}: {
  categories: CategoryWithSubs[]
  exercises: ExerciseWithCategory[]
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [addingTop, setAddingTop] = useState(false)
  const [addingSub, setAddingSub] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const toggle = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const exCount = (catId: string) =>
    exercises.filter(e => e.category_id === catId).length

  return (
    <div className="space-y-6">
      {/* Lista de categorías */}
      <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {categories.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)] p-4 text-center italic">
            Sin categorías todavía.
          </p>
        )}

        {categories.map(cat => (
          <div key={cat.id}>
            {/* Fila categoría */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--card)] group">
              <button onClick={() => toggle(cat.id)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                {expanded[cat.id] ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>

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

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                {cat.subcategories.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 pl-10 pr-4 py-2 border-t border-[var(--border)] group">
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div>
          <h2 className="text-sm font-medium mb-3">Asignar ejercicios</h2>
          <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] bg-[var(--card)]">
            {exercises.map(ex => (
              <ExerciseRow key={ex.id} exercise={ex} categories={categories} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
