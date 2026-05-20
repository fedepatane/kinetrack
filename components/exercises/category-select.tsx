'use client'

import { useState } from 'react'
import type { CategoryWithSubs } from '@/lib/db/queries/categories'

export function CategorySelect({
  categories,
  defaultValue = '',
}: {
  categories: CategoryWithSubs[]
  defaultValue?: string
}) {
  // Determinar el estado inicial a partir del defaultValue
  const initialCat = categories.find(c =>
    c.id === defaultValue || c.subcategories.some(s => s.id === defaultValue)
  )
  const initialSub = initialCat?.subcategories.find(s => s.id === defaultValue)

  const [selectedCat, setSelectedCat] = useState(initialCat?.id ?? '')
  const [selectedSub, setSelectedSub] = useState(initialSub?.id ?? '')

  const activeCat = categories.find(c => c.id === selectedCat)
  const finalValue = selectedSub || selectedCat || ''

  function handleCatChange(id: string) {
    setSelectedCat(id)
    setSelectedSub('')
  }

  return (
    <div className="space-y-2">
      {/* Campo oculto con el valor final */}
      <input type="hidden" name="category_id" value={finalValue} />

      {/* Nivel 1 */}
      <div>
        <label className="block text-sm mb-1.5">Categoría</label>
        <select
          value={selectedCat}
          onChange={e => handleCatChange(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
        >
          <option value="">Sin categoría</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Nivel 2 — solo si la categoría seleccionada tiene subcategorías */}
      {activeCat && activeCat.subcategories.length > 0 && (
        <div>
          <label className="block text-sm mb-1.5">Subcategoría</label>
          <select
            value={selectedSub}
            onChange={e => setSelectedSub(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
          >
            <option value="">Todas las subcategorías</option>
            {activeCat.subcategories.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
