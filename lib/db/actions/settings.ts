'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/session'
import { setSetting } from '@/lib/db/settings'

export async function setThemeSetting(theme: 'light' | 'dark' | 'system') {
  await requireAuth()
  setSetting('theme', theme)
  revalidatePath('/', 'layout')
}

export async function setAccentSetting(color: string) {
  await requireAuth()
  setSetting('accent', color)
  revalidatePath('/', 'layout')
}
