import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoSpace | Reservas de coworking',
  description: 'Encuentra y reserva espacios de coworking por horas.',
  keywords: ['coworking', 'reservas', 'espacios de trabajo', 'CoSpace'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col bg-(--background) text-(--foreground) antialiased selection:bg-emerald-200 selection:text-emerald-950">
        {children}
      </body>
    </html>
  )
}
