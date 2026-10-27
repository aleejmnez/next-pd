import { Suspense, type ReactElement } from 'react'
import type { Space } from '@prisma/client'
import { ArrowLeft, Building2, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { AppError } from '@/lib/errors'
import { spaceIdSchema } from '@/lib/validations'
import { getActiveSpaceById } from '@/services/space.service'
import { SpaceBookingForm } from '@/components/spaces/SpaceBookingForm'

type SpacePageProps = {
  params: Promise<{ id: string }>
}

type ColombiaDateParts = {
  year: number
  month: number
  day: number
}

const copFormatter: Intl.NumberFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const colombiaDateFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function getColombiaDateParts(date: Date): ColombiaDateParts {
  const parts: Intl.DateTimeFormatPart[] = colombiaDateFormatter.formatToParts(date)
  const yearPart: Intl.DateTimeFormatPart | undefined = parts.find(
    (part: Intl.DateTimeFormatPart): boolean => part.type === 'year'
  )
  const monthPart: Intl.DateTimeFormatPart | undefined = parts.find(
    (part: Intl.DateTimeFormatPart): boolean => part.type === 'month'
  )
  const dayPart: Intl.DateTimeFormatPart | undefined = parts.find(
    (part: Intl.DateTimeFormatPart): boolean => part.type === 'day'
  )

  if (!yearPart || !monthPart || !dayPart) {
    throw new Error('No se pudo calcular la fecha de Colombia')
  }

  return {
    year: Number(yearPart.value),
    month: Number(monthPart.value),
    day: Number(dayPart.value),
  }
}

function formatDateParts(parts: ColombiaDateParts): string {
  const year: string = String(parts.year).padStart(4, '0')
  const month: string = String(parts.month).padStart(2, '0')
  const day: string = String(parts.day).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMaximumBookingDate(date: Date): string {
  const colombiaDate: ColombiaDateParts = getColombiaDateParts(date)
  const shiftedDate: Date = new Date(
    Date.UTC(colombiaDate.year, colombiaDate.month - 1, colombiaDate.day + 30, 12)
  )
  const maximumDate: ColombiaDateParts = getColombiaDateParts(shiftedDate)
  return formatDateParts(maximumDate)
}

export default function SpacePage({ params }: SpacePageProps): ReactElement {
  return (
    <Suspense fallback={<SpacePageLoading />}>
      <SpaceDetails params={params} />
    </Suspense>
  )
}

function SpacePageLoading(): ReactElement {
  return (
    <section
      aria-label="Cargando espacio"
      className="mx-auto min-h-96 w-full max-w-7xl animate-pulse px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="h-5 w-36 rounded bg-emerald-100" />
      <div className="mt-8 h-10 w-96 max-w-full rounded bg-emerald-100" />
      <div className="mt-4 h-6 w-full max-w-xl rounded bg-emerald-100" />
    </section>
  )
}

async function SpaceDetails({ params }: SpacePageProps): Promise<ReactElement> {
  await connection()
  const routeParams: { id: string } = await params
  const validation = spaceIdSchema.safeParse(routeParams)

  if (!validation.success) notFound()

  let space: Space

  try {
    space = await getActiveSpaceById(validation.data.id)
  } catch (error: unknown) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') notFound()
    throw error
  }

  const currentDate: Date = new Date()
  const minDate: string = formatDateParts(getColombiaDateParts(currentDate))
  const maxDate: string = getMaximumBookingDate(currentDate)
  const description: string = space.description ?? 'Espacio de trabajo listo para reservar.'

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link
        className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-emerald-800"
        href="/spaces"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Volver a espacios
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            CoSpace / Espacios / Detalle
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold text-slate-900 sm:text-4xl">
            {space.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            {description}
          </p>

          <div className="relative mt-7 aspect-[16/9] max-w-3xl overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50">
            {space.imageUrl ? (
              <Image
                alt={`Espacio ${space.name}`}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                src={space.imageUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-emerald-700">
                <Building2 aria-hidden="true" className="h-12 w-12" />
              </div>
            )}
          </div>

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 border-y border-emerald-200 py-5">
            <div>
              <dt className="text-xs text-slate-600">Capacidad</dt>
              <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                <Users aria-hidden="true" className="h-4 w-4 text-emerald-700" />
                {space.capacity} {space.capacity === 1 ? 'persona' : 'personas'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-600">Tarifa por hora</dt>
              <dd className="mt-2 text-sm font-semibold text-emerald-800">
                {copFormatter.format(space.pricePerHour)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 max-w-2xl">
            <h2 className="text-sm font-semibold text-slate-900">Sobre este espacio</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <SpaceBookingForm
            maxDate={maxDate}
            minDate={minDate}
            pricePerHour={space.pricePerHour}
            spaceId={space.id}
            spaceName={space.name}
          />
        </aside>
      </div>
    </section>
  )
}
