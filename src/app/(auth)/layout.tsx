import React from 'react'
import Link from 'next/link'
import { Gavel, ArrowLeft } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090d16] text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Header with Back to Home Link */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al Inicio</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Gavel className="w-4 h-4 -rotate-12" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Bid<span className="text-amber-400">Hub</span>
          </span>
        </div>
      </header>

      {/* Centered Auth Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 BidHub Platform. Subastas seguras de coleccionables.</p>
      </footer>
    </div>
  )
}
