'use client'

import { useEffect } from 'react'

// Si el tema está en "Sistema", reacciona a los cambios del SO en vivo.
export function ThemeWatcher({ theme }: { theme: 'light' | 'dark' | 'system' }) {
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => document.documentElement.classList.toggle('dark', mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])
  return null
}
