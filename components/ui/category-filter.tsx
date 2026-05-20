'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import type { CategoryWithSubs } from '@/lib/db/queries/categories'

export function CategoryFilter({ categories }: { categories: CategoryWithSubs[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, start] = useTransition()

  const selectedCat = searchParams.get('cat') ?? ''
  const selectedSub = searchParams.get('sub') ?? ''

  const activeCat = categories.find(c => c.id === selectedCat)

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    start(() => router.replace(`${pathname}?${params.toString()}`))
  }

  function selectCat(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('cat', id)
    else params.delete('cat')
    params.delete('sub') // reset subcategory
    start(() => router.replace(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Nivel 1: categorías */}
      <select
        value={selectedCat}
        onChange={e => selectCat(e.target.value)}
        className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
      >
        <option value="">Todas las categorías</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {/* Nivel 2: subcategorías (solo si la categoría tiene hijos) */}
      {activeCat && activeCat.subcategories.length > 0 && (
        <select
          value={selectedSub}
          onChange={e => setParam('sub', e.target.value)}
          className="rounded-md border border-[var(--accent-teal)] bg-[var(--background)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] text-[var(--accent-teal)]"
        >
          <option value="">Todas las subcategorías</option>
          {activeCat.subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
