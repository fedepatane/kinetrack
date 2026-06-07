'use client'

import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'

// Recibe una ruta relativa (ej. /p/token) y arma el link con el dominio actual
// del navegador, así el link copiado funciona sea cual sea el dominio.
export function PublicLinkCopy({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const url = `${origin}${path}`

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2">
      <span className="flex-1 text-xs text-[var(--muted-foreground)] truncate">{url}</span>
      <button
        onClick={copy}
        className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
      >
        {copied ? <Check className="size-3.5 text-[var(--accent-teal)]" /> : <Copy className="size-3.5" />}
        {copied ? 'Copiado' : 'Copiar link'}
      </button>
    </div>
  )
}
