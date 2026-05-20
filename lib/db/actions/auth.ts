'use server'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export async function signIn(formData: FormData) {
  const password = formData.get('password')?.toString()
  const expected = process.env.KINE_PASSWORD ?? 'kine1234'

  if (!password || password !== expected) {
    redirect('/login?error=1')
  }

  const session = await getSession()
  session.isLoggedIn = true
  await session.save()
  redirect('/dashboard')
}

export async function signOut() {
  const session = await getSession()
  session.destroy()
  redirect('/login')
}
