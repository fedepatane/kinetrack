'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

// Lightbox: muestra una imagen expandida al clickear su miniatura.
export function ImageModal({
  src,
  alt,
  children,
}: {
  src: string
  alt: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors"
          >
            <X className="size-6" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh]" onClick={e => e.stopPropagation()}>
            <Image
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  )
}
