import type { ReactElement } from 'react'
import type { Space } from '@prisma/client'
import { ArrowUpRight, Building2, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type SpaceCardProps = {
  space: Space
}

const copFormatter: Intl.NumberFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function SpaceCard({ space }: SpaceCardProps): ReactElement {
  const formattedPrice: string = copFormatter.format(space.pricePerHour)
  const capacityLabel: string = space.capacity === 1 ? 'persona' : 'personas'
  const description: string = space.description ?? 'Espacio de trabajo listo para reservar.'

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-emerald-100 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300">
      <div className="relative -mx-5 -mt-5 mb-5 aspect-[16/9] overflow-hidden bg-emerald-50">
        {space.imageUrl ? (
          <Image
            alt={`Espacio ${space.name}`}
            className="object-cover"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            src={space.imageUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-emerald-700">
            <Building2 aria-hidden="true" className="h-9 w-9" />
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
          Disponible
        </span>
      </div>

      <div className="mt-5 flex-1">
        <h2 className="text-lg font-semibold text-slate-900">{space.name}</h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-emerald-100 pt-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            Capacidad: {space.capacity} {capacityLabel}
          </p>
          <p className="mt-2 text-base font-semibold text-emerald-800">
            {formattedPrice}
            <span className="ml-1 text-xs font-normal text-slate-500">/ hora</span>
          </p>
        </div>
        <Link
          aria-label={`Ver detalles de ${space.name}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 text-emerald-800 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
          href={`/spaces/${space.id}`}
          title="Ver detalles"
        >
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
