'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'

export function DeleteButton({
  onDelete,
  confirm = '¿Estás seguro? Esta acción no se puede deshacer.',
  label,
}: {
  onDelete: () => Promise<void> | void
  confirm?: string
  label?: string
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!window.confirm(confirm)) return
    startTransition(() => onDelete())
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-red-500 disabled:opacity-40 transition-colors ${label ? 'rounded-md border border-[var(--border)] px-3 py-1.5' : 'p-1.5'}`}
    >
      <Trash2 className="size-3.5" />
      {label && label}
    </button>
  )
}
