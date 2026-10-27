'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Building2,
  CalendarDays,
  Compass,
  LogIn,
  UserPlus,
  Menu,
  ShieldCheck,
  X,
  User,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavbarUser = {
  fullName?: string
  email: string
  role: string
}

type NavbarLink = {
  href: string
  label: string
  icon: LucideIcon
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseNavbarUser(payload: unknown): NavbarUser | null {
  if (!isRecord(payload) || !isRecord(payload.user)) return null
  if (typeof payload.user.email !== 'string' || typeof payload.user.role !== 'string') {
    return null
  }

  const user: NavbarUser = {
    email: payload.user.email,
    role: payload.user.role,
  }

  if (typeof payload.user.fullName === 'string') {
    user.fullName = payload.user.fullName
  }

  return user
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<NavbarUser | null>(null)
  const [isSessionLoaded, setIsSessionLoaded] = useState(false)

  useEffect(() => {
    const abortController: AbortController = new AbortController()

    async function loadSession(): Promise<void> {
      try {
        const response = await fetch('/api/auth/me', {
          signal: abortController.signal,
        })
        const payload: unknown = await response.json()
        const currentUser: NavbarUser | null = response.ok
          ? parseNavbarUser(payload)
          : null

        if (!abortController.signal.aborted) setUser(currentUser)
      } catch {
        if (!abortController.signal.aborted) setUser(null)
      } finally {
        if (!abortController.signal.aborted) setIsSessionLoaded(true)
      }
    }

    void loadSession()
    return () => abortController.abort()
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const navLinks: NavbarLink[] = [
    { href: '/spaces', label: 'Espacios', icon: Building2 },
  ]

  if (user) {
    navLinks.push({ href: '/dashboard', label: 'Mis reservas', icon: CalendarDays })

    if (user.role === 'ADMIN') {
      navLinks.push({ href: '/admin', label: 'Administración', icon: ShieldCheck })
    }
  } else if (isSessionLoaded) {
    navLinks.unshift({ href: '/', label: 'Inicio', icon: Compass })
  }

  return (
    <header className="sticky top-0 z-50 glass-nav transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm shadow-emerald-900/5 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                Co<span className="text-emerald-700">Space</span>
              </span>
              <span className="block text-[10px] tracking-widest uppercase text-slate-600 font-semibold -mt-1">
                Reservas de Coworking
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(`${link.href}/`))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-sm'
                      : 'text-slate-700 hover:text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-100 text-xs shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 leading-tight">
                      {user.fullName || user.email.split('@')[0]}
                    </p>
                    <span className="text-[10px] text-emerald-700 uppercase font-mono">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Modo Vista Pública
                </div>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-900/10 transition-all transform hover:-translate-y-0.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarse</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-emerald-900 hover:bg-emerald-50"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-emerald-100 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(`${link.href}/`))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-900 font-semibold'
                      : 'text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="pt-3 border-t border-emerald-100 space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 rounded-lg bg-white border border-emerald-100 text-xs">
                  <p className="font-semibold text-slate-800">{user.fullName || user.email}</p>
                  <span className="text-[10px] text-emerald-700 uppercase font-mono">{user.role}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-emerald-200 text-sm font-semibold text-emerald-800 bg-white hover:bg-emerald-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registro</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
