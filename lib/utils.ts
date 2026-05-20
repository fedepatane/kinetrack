import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYoutubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url)
    let videoId: string | null = null

    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1)
    } else if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v')
    }

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
  } catch {
    return null
  }
}

export function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    let videoId: string | null = null

    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1)
    } else if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v')
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } catch {
    return null
  }
}

const intensityLabel: Record<string, (v: number) => string> = {
  rpe: v => `RPE ${v}`,
  rir: v => `RIR ${v}`,
  '1rm': v => `${v}% 1RM`,
}

export function formatDose(be: {
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  intensity_type?: 'rpe' | 'rir' | '1rm' | null
  intensity_value?: number | null
}): string {
  const parts: string[] = []
  if (be.sets && be.reps) parts.push(`${be.sets}×${be.reps} reps`)
  else if (be.sets) parts.push(`${be.sets} series`)
  else if (be.reps) parts.push(`${be.reps} reps`)
  if (be.duration_seconds) parts.push(`${be.duration_seconds}s`)
  if (be.intensity_type && be.intensity_value != null) {
    parts.push(intensityLabel[be.intensity_type]?.(be.intensity_value) ?? '')
  }
  if (be.rest_seconds) parts.push(`${be.rest_seconds}s descanso`)
  return parts.join(' · ') || 'Sin prescripción'
}
