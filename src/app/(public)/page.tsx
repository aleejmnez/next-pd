import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-white">CoSpace</h1>
      <p className="max-w-xl text-slate-300">
        Plataforma de reservas por horas para espacios de coworking.
      </p>
      <div className="flex gap-4">
        <Link className="rounded-md bg-white px-4 py-2 text-slate-950" href="/login">
          Iniciar sesión
        </Link>
        <Link className="rounded-md border border-white/30 px-4 py-2 text-white" href="/register">
          Crear cuenta
        </Link>
      </div>
    </main>
  )
}
