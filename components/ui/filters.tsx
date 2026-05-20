'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import { Search, X } from 'lucide-react'

function useFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const set = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }, [router, pathname, searchParams])

  const get = (key: string) => searchParams.get(key) ?? ''

  const clear = useCallback(() => {
    startTransition(() => router.replace(pathname))
  }, [router, pathname])

  const hasFilters = searchParams.toString() !== ''

  return { set, get, clear, hasFilters }
}

export function SearchInput({ placeholder = 'Buscar...' }: { placeholder?: string }) {
  const { set, get } = useFilter()
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
      <input
        type="text"
        value={get('q')}
        onChange={e => set('q', e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
      />
      {get('q') && (
        <button onClick={() => set('q', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export function SelectFilter({
  name, options, placeholder,
}: {
  name: string
  options: { value: string; label: string }[]
  placeholder: string
}) {
  const { set, get } = useFilter()
  return (
    <select
      value={get(name)}
      onChange={e => set(name, e.target.value)}
      className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] text-[var(--foreground)]"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function ClearFilters() {
  const { clear, hasFilters } = useFilter()
  if (!hasFilters) return null
  return (
    <button onClick={clear} className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
      <X className="size-3" /> Limpiar
    </button>
  )
}
