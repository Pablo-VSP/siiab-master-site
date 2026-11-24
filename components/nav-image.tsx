"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Muestra una imagen de `public/logos` y, si no hay `src` o el archivo no
// existe, cae al ícono lucide indicado. Así un nombre mal escrito en Keymaster
// nunca deja un ícono roto en la navegación.
export function NavImage({
  src,
  fallback: Fallback,
  alt = "",
  className,
  fallbackClassName,
}: {
  src: string | null
  fallback: LucideIcon
  alt?: string
  className?: string
  fallbackClassName?: string
}) {
  // Guardamos el src que falló (y no un booleano) para que, si cambia el src,
  // se vuelva a intentar cargar.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return <Fallback className={fallbackClassName} aria-hidden="true" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={cn("object-contain", className)}
    />
  )
}
