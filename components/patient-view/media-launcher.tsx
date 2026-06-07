'use client'

import type { Media } from '@/lib/utils'
import { VideoLauncher } from './video-launcher'
import { ImageModal } from './image-modal'

// Abre la media de un ejercicio según su tipo: reproduce el video
// (modal o pestaña nueva) o expande la imagen en un lightbox.
export function MediaLauncher({
  media,
  title,
  children,
}: {
  media: Media
  title: string
  children: React.ReactNode
}) {
  if (media.mode === 'image') {
    return (
      <ImageModal src={media.src} alt={title}>
        {children}
      </ImageModal>
    )
  }
  return (
    <VideoLauncher video={media.video} title={title}>
      {children}
    </VideoLauncher>
  )
}
