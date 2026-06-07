'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'

// Input de tags con autocompletado: muestra los tags existentes y los filtra
// a medida que se escribe. Permite elegir uno o crear uno nuevo (Enter / coma).
export function TagInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
}) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = input.trim().toLowerCase()
  // Sugerencias que coinciden con lo escrito y que todavía no están elegidas
  const matches = suggestions.filter(
    s => !value.includes(s) && s.toLowerCase().includes(query)
  )
  const canCreate = input.trim() !== '' && !suggestions.some(s => s.toLowerCase() === query) && !value.some(v => v.toLowerCase() === query)

  function addTag(tag: string) {
    const t = tag.trim()
    if (!t) return
    if (!value.some(v => v.toLowerCase() === t.toLowerCase())) onChange([...value, t])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      // Si hay una coincidencia exacta o única, la usa; si no, crea el nuevo
      const exact = matches.find(m => m.toLowerCase() === query)
      addTag(exact ?? input)
    } else if (e.key === 'Backspace' && !input && value.length) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setFocused(false)
    }
  }

  const showDropdown = focused && (matches.length > 0 || canCreate)

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 focus-within:ring-1 focus-within:ring-[var(--accent-teal)]">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] text-xs px-2 py-0.5 font-medium">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70" aria-label={`Quitar ${tag}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setFocused(true) }}
          onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 120) }}
          placeholder={value.length === 0 ? 'Agregar tag (ej. rodilla)…' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none py-0.5 placeholder:text-[var(--muted-foreground)]"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg py-1">
          {matches.map(m => (
            <button
              key={m}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => addTag(m)}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
            >
              {m}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => addTag(input)}
              className="block w-full text-left px-3 py-1.5 text-sm text-[var(--accent-teal)] hover:bg-[var(--muted)] transition-colors"
            >
              Crear «{input.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  )
}
