'use client'

import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'

export function VideoModal({
  src,
  kind = 'embed',
  title,
  children,
}: {
  src: string
  kind?: 'embed' | 'file'
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 z-10 text-white/80 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
            <div className="aspect-video">
              {kind === 'file' && failed ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6 bg-[var(--card)]">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No se pudo reproducir el video acá. El sitio que lo aloja puede estar bloqueando el acceso directo.
                  </p>
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="size-3.5" /> Abrir en pestaña nueva
                  </a>
                </div>
              ) : kind === 'file' ? (
                <video
                  src={src}
                  title={title}
                  controls
                  autoPlay
                  onError={() => setFailed(true)}
                  className="w-full h-full"
                />
              ) : (
                <iframe
                  src={`${src}${src.includes('?') ? '&' : '?'}autoplay=1`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
