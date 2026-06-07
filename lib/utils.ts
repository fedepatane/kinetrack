import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 15 colores bien diferenciados para asignar a las categorías.
export const CATEGORY_COLORS = [
  '#ef4444', // rojo
  '#f97316', // naranja
  '#f59e0b', // ámbar
  '#eab308', // amarillo
  '#84cc16', // lima
  '#22c55e', // verde
  '#10b981', // esmeralda
  '#14b8a6', // turquesa
  '#06b6d4', // cyan
  '#3b82f6', // azul
  '#6366f1', // índigo
  '#8b5cf6', // violeta
  '#a855f7', // púrpura
  '#ec4899', // rosa
  '#78716c', // gris
]

// Extrae el ID de un video de YouTube en cualquier formato:
// watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, /live/ID
function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('/')[0] || null
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?#]+)/)
      if (m?.[1]) return m[1]
    }
    return null
  } catch {
    return null
  }
}

export function getYoutubeThumbnail(url: string): string | null {
  const id = getYoutubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

// Resultado de analizar un link de video de cualquier origen
export type ResolvedVideo = {
  // 'embed' = se mete en un iframe (YouTube, Vimeo, Drive, etc.)
  // 'file'  = archivo de video directo, se reproduce con <video>
  // 'link'  = no se puede embeber, se abre en una pestaña nueva
  // 'image' = el link es una imagen, se muestra expandida
  kind: 'embed' | 'file' | 'link' | 'image'
  src: string
  thumbnail: string | null
}

const VIDEO_FILE_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i
const IMAGE_FILE_RE = /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i

// Detecta el tipo de link y devuelve cómo reproducirlo.
// Soporta YouTube, Vimeo, Google Drive, Loom, archivos directos (.mp4/.webm/…)
// y, como fallback, cualquier URL pública abierta en pestaña nueva.
export function resolveVideo(url: string): ResolvedVideo | null {
  if (!url?.trim()) return null
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null

  const host = u.hostname.replace(/^www\./, '')

  // YouTube
  const ytEmbed = getYoutubeEmbedUrl(url)
  if (ytEmbed) {
    return { kind: 'embed', src: ytEmbed, thumbnail: getYoutubeThumbnail(url) }
  }

  // Vimeo — vimeo.com/12345 o player.vimeo.com/video/12345
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean).pop()
    if (id && /^\d+$/.test(id)) {
      return { kind: 'embed', src: `https://player.vimeo.com/video/${id}`, thumbnail: null }
    }
  }

  // Google Drive — drive.google.com/file/d/ID/view
  if (host === 'drive.google.com') {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/)
    const id = m?.[1] ?? u.searchParams.get('id')
    if (id) {
      return { kind: 'embed', src: `https://drive.google.com/file/d/${id}/preview`, thumbnail: null }
    }
  }

  // Loom — loom.com/share/ID
  if (host === 'loom.com') {
    const m = u.pathname.match(/\/share\/([^/?]+)/)
    if (m?.[1]) {
      return { kind: 'embed', src: `https://www.loom.com/embed/${m[1]}`, thumbnail: null }
    }
  }

  // Archivo de video directo
  if (VIDEO_FILE_RE.test(u.pathname)) {
    return { kind: 'file', src: url, thumbnail: null }
  }

  // Imagen directa → se muestra expandida (la propia imagen es su miniatura)
  if (IMAGE_FILE_RE.test(u.pathname)) {
    return { kind: 'image', src: url, thumbnail: url }
  }

  // Cualquier otra página: no se puede embeber de forma confiable → abrir aparte
  return { kind: 'link', src: url, thumbnail: null }
}

// La "media" de un ejercicio: puede ser un video reproducible o una imagen
// expandible. Unifica el link principal (video_url) y la miniatura manual.
export type Media =
  | { mode: 'video'; video: ResolvedVideo; thumb: string | null }
  | { mode: 'image'; src: string; thumb: string }

export function resolveMedia(videoUrl: string | null | undefined, thumbnailUrl: string | null | undefined): Media | null {
  const v = videoUrl ? resolveVideo(videoUrl) : null

  // Es un video de verdad (no una imagen) → modo video
  if (v && v.kind !== 'image') {
    return { mode: 'video', video: v, thumb: thumbnailUrl ?? v.thumbnail ?? null }
  }

  // Si no, mostramos una imagen: la del link (si era imagen) o la miniatura cargada
  const src = (v?.kind === 'image' ? v.src : null) ?? thumbnailUrl ?? null
  if (src) return { mode: 'image', src, thumb: thumbnailUrl ?? src }

  return null
}

const intensityLabel: Record<string, (v: number) => string> = {
  rpe: v => `RPE ${v}`,
  rir: v => `RIR ${v}`,
  '1rm': v => `${v}% 1RM`,
}

export function formatDose(be: {
  sets: number | null
  reps: number | null
  reps_max?: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  intensity_type?: 'rpe' | 'rir' | '1rm' | null
  intensity_value?: number | null
  per_side?: 0 | 1 | boolean | null
  notes?: string | null
}): string {
  const parts: string[] = []

  // Reps: número fijo o rango (ej. 8–12)
  const repsText = be.reps != null
    ? (be.reps_max && be.reps_max > be.reps ? `${be.reps}–${be.reps_max}` : `${be.reps}`)
    : null

  if (be.sets && repsText) parts.push(`${be.sets}×${repsText} reps`)
  else if (be.sets && be.duration_seconds) parts.push(`${be.sets}×${be.duration_seconds}s`)
  else if (be.sets) parts.push(`${be.sets} series`)
  else if (repsText) parts.push(`${repsText} reps`)

  // Duración: solo si no se mostró ya junto a las series
  if (be.duration_seconds && !(be.sets && !repsText)) parts.push(`${be.duration_seconds}s`)

  if (be.per_side) parts.push('por lado')
  if (be.intensity_type && be.intensity_value != null) {
    parts.push(intensityLabel[be.intensity_type]?.(be.intensity_value) ?? '')
  }
  if (be.rest_seconds) parts.push(`${be.rest_seconds}s descanso`)

  // Nota de dosificación: se suma a lo anterior y, si no hay nada más, es la prescripción.
  const note = be.notes?.trim()
  if (note) parts.push(note)

  return parts.join(' · ') || 'Sin prescripción'
}
