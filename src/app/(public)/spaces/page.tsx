import { Suspense, type ReactElement } from 'react'
import type { Space } from '@prisma/client'
import { connection } from 'next/server'
import { listActiveSpaces } from '@/services/space.service'
import { SpaceCard } from '@/components/spaces/SpaceCard'

export default function SpacesPage(): ReactElement {
  return (
    <Suspense fallback={<SpacesLoading />}>
      <SpacesCatalog />
    </Suspense>
  )
}

function SpacesLoading(): ReactElement {
  return (
    <section
      aria-label="Cargando espacios"
      className="mx-auto min-h-96 w-full max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="h-9 w-72 rounded bg-emerald-100" />
      <div className="mt-4 h-5 w-full max-w-xl rounded bg-emerald-100" />
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-56 rounded-lg bg-white shadow-sm" />
        <div className="h-56 rounded-lg bg-white shadow-sm" />
        <div className="h-56 rounded-lg bg-white shadow-sm" />
      </div>
    </section>
  )
}

async function SpacesCatalog(): Promise<ReactElement> {
  await connection()
  const spaces: Space[] = await listActiveSpaces()

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="mb-10 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          CoSpace / Espacios
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Encuentra tu lugar de trabajo
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Puestos flexibles, cabinas privadas y salas para trabajar a tu ritmo.
          Todos los precios están expresados en pesos colombianos por hora.
        </p>
      </header>

      {spaces.length === 0 ? (
        <div className="rounded-lg border border-emerald-100 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">No hay espacios disponibles</h2>
          <p className="mt-2 text-sm text-slate-600">
            Vuelve pronto para consultar nuevas opciones.
          </p>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space: Space) => (
            <li key={space.id}>
              <SpaceCard space={space} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
