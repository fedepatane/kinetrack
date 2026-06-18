'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BlockWithExercises, BlockExerciseWithExercise } from '@/lib/db/queries/routines'
import { MediaLauncher } from './media-launcher'
import { ExerciseDetails } from './exercise-details'
import { formatDose, resolveMedia } from '@/lib/utils'
import Image from 'next/image'

export function ExerciseRow({ be }: { be: BlockExerciseWithExercise }) {
  const ex = be.exercise
  if (!ex) return null
  const media = resolveMedia(ex.video_url, ex.thumbnail_url)
  const thumb = media?.thumb ?? null
  const color = ex.category_color

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 hover:border-[var(--accent-teal)] transition-colors"
      style={color ? { borderLeftColor: color, borderLeftWidth: 5 } : undefined}>
      <div className="w-28 h-16 rounded-xl bg-[var(--muted)] flex-shrink-0 overflow-hidden relative">
        {media ? (
          <MediaLauncher media={media} title={ex.name}>
            <button className="absolute inset-0 w-full h-full cursor-pointer">
              {thumb && <Image src={thumb} alt={ex.name} width={112} height={64} className="object-cover w-full h-full" />}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
                <span className="text-white/80 text-lg drop-shadow">{media.mode === 'image' ? '⤢' : '▶'}</span>
              </div>
            </button>
          </MediaLauncher>
        ) : thumb ? (
          <Image src={thumb} alt={ex.name} width={112} height={64} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-xs">Sin video</div>
        )}
      </div>
      <ExerciseDetails name={ex.name} dose={formatDose(be)} description={ex.description} />
    </div>
  )
}

export function CollapsibleBlock({ block, defaultOpen = false }: { block: BlockWithExercises; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const count = block.block_exercises.length

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[var(--muted)]/50 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-[var(--foreground)] truncate">{block.name}</span>
          <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
            {count} {count === 1 ? 'ejercicio' : 'ejercicios'}
          </span>
        </span>
        <ChevronDown className={`size-4 text-[var(--muted-foreground)] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)]">
          {block.notes && (
            <p className="text-sm text-[var(--muted-foreground)] my-3 italic">{block.notes}</p>
          )}
          <div className="space-y-2.5">
            {[...block.block_exercises]
              .sort((a, b) => a.order_index - b.order_index)
              .map(be => <ExerciseRow key={be.id} be={be} />)}
          </div>
        </div>
      )}
    </div>
  )
}
