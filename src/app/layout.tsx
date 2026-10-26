import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BidHub | Plataforma Exclusiva de Subastas Coleccionables',
  description: 'Subastas en tiempo real de cartas raras, relojes vintage, vinilos de primera edición y figuras de colección. Seguro, transparente y verificado.',
  keywords: ['subastas', 'coleccionables', 'relojes vintage', 'cartas pokemon', 'vinilos', 'bidhub'],
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
