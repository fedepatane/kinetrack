'use client'

import { signIn } from '@/lib/db/actions/auth'
import { useSearchParams } from 'next/navigation'

export function LoginForm() {
  const params = useSearchParams()
  const error = params.get('error')

  return (
    <form action={signIn} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm mb-1.5">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">Contraseña incorrecta.</p>
      )}
      <button
        type="submit"
        className="w-full rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Ingresar
      </button>
    </form>
  )
}
