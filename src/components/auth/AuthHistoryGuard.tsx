'use client'

import { useEffect } from 'react'

export function AuthHistoryGuard() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent): void => {
      if (!event.persisted) return

      void fetch('/api/auth/me', { cache: 'no-store' })
        .then((response: Response): void => {
          if (response.ok) window.location.replace('/')
        })
        .catch((error: unknown): void => {
          console.error('Error al comprobar la sesión al volver a una página de autenticación:', error)
        })
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  return null
}
