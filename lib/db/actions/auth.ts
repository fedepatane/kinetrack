'use server'

import { redirect } from 'next/navigation'
import { getSession, requireAuth } from '@/lib/session'
import { checkPassword, savePassword } from '@/lib/db/settings'

export async function signIn(formData: FormData) {
  const password = formData.get('password')?.toString()

  if (!password || !checkPassword(password)) {
    redirect('/login?error=1')
  }

  const session = await getSession()
  session.isLoggedIn = true
  await session.save()
  redirect('/dashboard')
}

export async function changePassword(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  await requireAuth()
  const current = formData.get('current')?.toString() ?? ''
  const next = formData.get('next')?.toString() ?? ''
  const confirm = formData.get('confirm')?.toString() ?? ''

  if (!checkPassword(current)) return { error: 'La contraseña actual no es correcta.' }
  if (next.length < 4) return { error: 'La nueva contraseña debe tener al menos 4 caracteres.' }
  if (next !== confirm) return { error: 'Las contraseñas nuevas no coinciden.' }

  savePassword(next)
  return { ok: true }
}

export async function signOut() {
  const session = await getSession()
  session.destroy()
  redirect('/login')
}
