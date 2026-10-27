import React from 'react'
import Link from 'next/link'
import { Building2, Shield, CalendarCheck, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#070a12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">
                Co<span className="text-amber-400">Space</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Reserva espacios de coworking por horas con disponibilidad y precios claros.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> Reservas seguras
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-amber-400" /> Horarios flexibles
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
                <Link href="/spaces" className="hover:text-amber-400 transition-colors">
                  Espacios
                </Link>
              </li>
            </ul>
          </div>

          {/* Cuenta y Acceso */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Cuenta
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
                  Gestiona tus próximas reservas desde tu cuenta.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CoSpace. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Desarrollado con Next.js 16, Supabase & Prisma
          </p>
        </div>
      </div>
    </footer>
  )
}
