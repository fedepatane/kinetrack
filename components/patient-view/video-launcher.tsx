'use client'

import type { ResolvedVideo } from '@/lib/utils'
import { VideoModal } from './video-modal'

// Decide cómo abrir un video: modal embebido (YouTube/Vimeo/archivo/…)
// o pestaña nueva cuando el origen no se puede embeber.
export function VideoLauncher({
  video,
  title,
  children,
}: {
  video: ResolvedVideo
  title: string
  children: React.ReactNode
}) {
  if (video.kind === 'link') {
    return (
      <a href={video.src} target="_blank" rel="noopener noreferrer" className="contents">
        {children}
      </a>
    )
  }
  return (
    <VideoModal src={video.src} kind={video.kind === 'file' ? 'file' : 'embed'} title={title}>
      {children}
    </VideoModal>
  )
}
