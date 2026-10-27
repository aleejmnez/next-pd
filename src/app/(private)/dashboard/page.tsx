'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock3, X } from 'lucide-react'

type BookingStatus = 'CONFIRMED' | 'CANCELLED'

type DashboardBooking = {
  id: string
  status: BookingStatus
  startTime: string
  endTime: string
  totalPrice: number
  cancelledAt: string | null
  space: {
    name: string
  }
}

type DashboardUser = {
  role: string
}

const dateFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'medium',
  timeStyle: 'short',
})

const priceFormatter: Intl.NumberFormat = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseBooking(value: unknown): DashboardBooking | null {
  if (!isRecord(value) || !isRecord(value.space)) return null

  if (
    typeof value.id !== 'string' ||
    (value.status !== 'CONFIRMED' && value.status !== 'CANCELLED') ||
    typeof value.startTime !== 'string' ||
    !Number.isFinite(Date.parse(value.startTime)) ||
    typeof value.endTime !== 'string' ||
    !Number.isFinite(Date.parse(value.endTime)) ||
    typeof value.totalPrice !== 'number' ||
    !Number.isFinite(value.totalPrice) ||
    (value.cancelledAt !== null && typeof value.cancelledAt !== 'string') ||
    typeof value.space.name !== 'string'
  ) {
    return null
  }

  return {
    id: value.id,
    status: value.status,
    startTime: value.startTime,
    endTime: value.endTime,
    totalPrice: value.totalPrice,
    cancelledAt: value.cancelledAt,
    space: { name: value.space.name },
  }
}

function parseBookingList(payload: unknown): DashboardBooking[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.bookings)) return null

  const bookings: DashboardBooking[] = []

  for (const item of payload.bookings) {
    const booking: DashboardBooking | null = parseBooking(item)
    if (!booking) return null
    bookings.push(booking)
  }

  return bookings
}

function parseUser(payload: unknown): DashboardUser | null {
  if (!isRecord(payload) || !isRecord(payload.user)) return null
  if (typeof payload.user.role !== 'string') return null
  return { role: payload.user.role }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    isRecord(payload) &&
    isRecord(payload.error) &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return fallback
}

function canCancelBooking(booking: DashboardBooking, isAdmin: boolean): boolean {
  if (booking.status !== 'CONFIRMED') return false
  if (isAdmin) return true

  const cancellationDeadline: number = Date.parse(booking.startTime) - 2 * 60 * 60 * 1000
  return Date.now() <= cancellationDeadline
}

function getStatusLabel(status: BookingStatus): string {
  if (status === 'CONFIRMED') return 'Confirmada'
  return 'Cancelada'
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<DashboardBooking[]>([])
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const abortController: AbortController = new AbortController()

    async function loadDashboard(): Promise<void> {
      try {
        const [bookingsResponse, userResponse] = await Promise.all([
          fetch('/api/bookings', { signal: abortController.signal }),
          fetch('/api/auth/me', { signal: abortController.signal }),
        ])
        const [bookingsPayload, userPayload]: [unknown, unknown] = await Promise.all([
          bookingsResponse.json(),
          userResponse.json(),
        ])

        if (!bookingsResponse.ok) {
          throw new Error(getErrorMessage(bookingsPayload, 'No se pudieron cargar las reservas'))
        }

        if (!userResponse.ok) {
          throw new Error(getErrorMessage(userPayload, 'Debes iniciar sesión'))
        }

        const parsedBookings: DashboardBooking[] | null = parseBookingList(bookingsPayload)
        const user: DashboardUser | null = parseUser(userPayload)

        if (!parsedBookings || !user) {
          throw new Error('El servidor devolvió datos de reserva no válidos')
        }

        setBookings(parsedBookings)
        setIsAdmin(user.role === 'ADMIN')
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        const message: string = error instanceof Error
          ? error.message
          : 'No se pudieron cargar las reservas'
        setErrorMessage(message)
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false)
      }
    }

    void loadDashboard()
    return () => abortController.abort()
  }, [])

  async function handleCancel(bookingId: string): Promise<void> {
    const booking: DashboardBooking | undefined = bookings.find(
      (item: DashboardBooking): boolean => item.id === bookingId
    )

    if (!booking || !canCancelBooking(booking, isAdmin)) return
    if (!window.confirm(`¿Cancelar la reserva de ${booking.space.name}?`)) return

    setCancellingId(bookingId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
      const payload: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'No se pudo cancelar la reserva'))
      }

      if (!isRecord(payload)) {
        throw new Error('El servidor devolvió una respuesta no válida')
      }

      const cancelledBooking: DashboardBooking | null = parseBooking(payload.booking)
      if (!cancelledBooking) {
        throw new Error('El servidor devolvió una reserva no válida')
      }

      setBookings((currentBookings: DashboardBooking[]): DashboardBooking[] =>
        currentBookings.map((item: DashboardBooking): DashboardBooking =>
          item.id === bookingId ? cancelledBooking : item
        )
      )
    } catch (error: unknown) {
      const message: string = error instanceof Error
        ? error.message
        : 'No se pudo cancelar la reserva'
      setErrorMessage(message)
    } finally {
      setCancellingId(null)
    }
  }

  const confirmedCount: number = bookings.filter(
    (booking: DashboardBooking): boolean => booking.status === 'CONFIRMED'
  ).length

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="mb-8 flex flex-col gap-5 border-b border-emerald-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            CoSpace / Mi cuenta
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Mis reservas</h1>
          <p className="mt-2 text-sm text-slate-600">
            {confirmedCount} reservas confirmadas
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
          href="/spaces"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Volver a Espacios
        </Link>
      </header>

      {errorMessage ? (
        <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <p aria-live="polite" className="py-10 text-sm text-slate-600">
          Cargando reservas…
        </p>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg border border-emerald-100 bg-white px-6 py-12 text-center shadow-sm">
          <CalendarDays aria-hidden="true" className="mx-auto h-8 w-8 text-emerald-700" />
          <h2 className="mt-4 text-lg font-medium text-slate-900">Aún no tienes reservas</h2>
          <p className="mt-2 text-sm text-slate-600">
            Elige un espacio para planear tu próxima jornada.
          </p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900" href="/spaces">
            Explorar espacios
          </Link>
        </div>
      ) : (
        <ul className="list-none space-y-3 p-0">
          {bookings.map((booking: DashboardBooking) => {
            const mayCancel: boolean = canCancelBooking(booking, isAdmin)
            const formattedStart: string = dateFormatter.format(new Date(booking.startTime))
            const formattedEnd: string = dateFormatter.format(new Date(booking.endTime))

            return (
              <li key={booking.id}>
                <article className="grid gap-4 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{booking.space.name}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                        booking.status === 'CONFIRMED'
                          ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                          : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                      <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
                      {formattedStart} – {formattedEnd}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                      <Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      Hora de Colombia
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-emerald-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <p className="text-sm font-semibold text-emerald-800">
                      {priceFormatter.format(booking.totalPrice)}
                    </p>
                    {booking.status === 'CONFIRMED' ? (
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!mayCancel || cancellingId === booking.id}
                        onClick={() => handleCancel(booking.id)}
                        title={mayCancel ? 'Cancelar reserva' : 'La cancelación está cerrada 2 horas antes del inicio'}
                        type="button"
                      >
                        <X aria-hidden="true" className="h-3.5 w-3.5" />
                        {cancellingId === booking.id ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
