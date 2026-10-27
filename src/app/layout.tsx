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
    <html lang="es" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  )
}
