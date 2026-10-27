import { Suspense, type ReactElement } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function HomePage(): ReactElement {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  )
}

function HomeLoading(): ReactElement {
  return (
    <main
      aria-label="Cargando CoSpace"
      className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-6 px-6 py-20 text-center"
    >
      <h1 className="text-4xl font-bold text-emerald-950">CoSpace</h1>
      <p aria-live="polite" className="text-sm text-slate-600">Cargando…</p>
    </main>
  )
}

async function HomeContent(): Promise<ReactElement> {
  const user = await getCurrentUser()

  if (user) redirect('/spaces')

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
        Espacios para trabajar mejor
      </p>
      <h1 className="text-4xl font-bold text-emerald-950 sm:text-5xl">CoSpace</h1>
      <p className="max-w-xl text-slate-600">
        Plataforma de reservas por horas para espacios de coworking.
      </p>
      <div className="flex gap-4">
        <Link className="rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700" href="/login">
          Iniciar sesión
        </Link>
        <Link className="rounded-md border border-emerald-200 bg-white px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-50" href="/register">
          Crear cuenta
        </Link>
      </div>
    </main>
  )
}
