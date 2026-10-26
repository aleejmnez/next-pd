import React from 'react'
import Link from 'next/link'
import { Gavel, Shield, Award, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#070a12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                <Gavel className="w-5 h-5 -rotate-12" />
              </div>
              <span className="text-xl font-bold text-white">
                Bid<span className="text-amber-400">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              La plataforma premier de subastas en línea para coleccionistas. Autenticidad garantizada, ofertas en tiempo real y transacciones seguras con tecnología moderna.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> Verificación Certificada
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Artículos Originales
              </span>
            </div>
          </div>

          {/* Links Navegación */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Explorar
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/auctions" className="hover:text-amber-400 transition-colors">
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <Link href="/auctions?status=ACTIVE" className="hover:text-amber-400 transition-colors">
                  Subastas Activas
                </Link>
              </li>
              <li>
                <Link href="/auctions?status=CLOSED" className="hover:text-amber-400 transition-colors">
                  Subastas Cerradas
                </Link>
              </li>
            </ul>
          </div>

          {/* Cuenta y Acceso */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Participar
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors">
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-amber-400 transition-colors">
                  Crear Cuenta Nueva
                </Link>
              </li>
              <li>
                <span className="text-xs text-slate-500 inline-block mt-2">
                  * En modo público puedes consultar el catálogo e información sin restricciones.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 BidHub Platform. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Desarrollado con Next.js 16, Supabase & Prisma
          </p>
        </div>
      </div>
    </footer>
  )
}
