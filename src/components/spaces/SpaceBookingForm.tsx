'use client'

import { useState, type FormEvent, type ReactElement } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react'

type SpaceBookingFormProps = {
  spaceId: string
  spaceName: string
  pricePerHour: number
  minDate: string
  maxDate: string
}

type BookingResponse = {
  id: string
  status: string
  startTime: string
}

function parseErrorMessage(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'object' &&
    payload.error !== null &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return 'No se pudo crear la reserva'
}

function parseBookingResponse(payload: unknown): BookingResponse | null {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('booking' in payload) ||
    typeof payload.booking !== 'object' ||
    payload.booking === null ||
    !('id' in payload.booking) ||
    typeof payload.booking.id !== 'string' ||
    !('status' in payload.booking) ||
    typeof payload.booking.status !== 'string' ||
    !('startTime' in payload.booking) ||
    typeof payload.booking.startTime !== 'string'
  ) {
    return null
  }

  return {
    id: payload.booking.id,
    status: payload.booking.status,
    startTime: payload.booking.startTime,
  }
}

export function SpaceBookingForm({
  spaceId,
  spaceName,
  pricePerHour,
  minDate,
  maxDate,
}: SpaceBookingFormProps): ReactElement {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [startHour, setStartHour] = useState<number>(8)
  const [durationHours, setDurationHours] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdBooking, setCreatedBooking] = useState<BookingResponse | null>(null)

  const availableDurations: number[] = [1, 2, 3, 4].filter(
    (duration: number): boolean => startHour + duration <= 21
  )
  const totalPrice: number = durationHours * pricePerHour

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setErrorMessage(null)
    setCreatedBooking(null)

    if (!selectedDate || startHour + durationHours > 21) {
      setErrorMessage('Selecciona una fecha y un horario válido.')
      return
    }

    setIsSubmitting(true)

    try {
      const startTime: string = `${selectedDate}T${String(startHour).padStart(2, '0')}:00:00-05:00`
      const endHour: number = startHour + durationHours
      const endTime: string = `${selectedDate}T${String(endHour).padStart(2, '0')}:00:00-05:00`
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, startTime, endTime }),
      })
      const payload: unknown = await response.json()

      if (!response.ok) {
        throw new Error(parseErrorMessage(payload))
      }

      const booking: BookingResponse | null = parseBookingResponse(payload)
      if (!booking) {
        throw new Error('El servidor devolvió una respuesta de reserva no válida')
      }

      setCreatedBooking(booking)
    } catch (error: unknown) {
      const message: string = error instanceof Error
        ? error.message
        : 'No se pudo crear la reserva'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Reservar por hora
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">{spaceName}</h2>
      </div>

      {createdBooking ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4" role="status">
          <p className="font-medium text-emerald-900">Reserva confirmada</p>
          <p className="mt-1 text-sm text-emerald-800">
            {new Intl.DateTimeFormat('es-CO', {
              timeZone: 'America/Bogota',
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(createdBooking.startTime))}
          </p>
          <Link
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
            href="/dashboard"
          >
            Ver mis reservas <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700" htmlFor="booking-date">
              Fecha (hora de Colombia)
            </label>
            <div className="relative">
              <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="h-11 w-full rounded-md border border-emerald-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                id="booking-date"
                max={maxDate}
                min={minDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                required
                type="date"
                value={selectedDate}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700" htmlFor="booking-start">
                Hora de inicio
              </label>
              <div className="relative">
                <Clock3 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select
                  className="h-11 w-full appearance-none rounded-md border border-emerald-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  id="booking-start"
                  onChange={(event) => setStartHour(Number(event.target.value))}
                  value={startHour}
                >
                  {Array.from({ length: 14 }, (_value: undefined, index: number) => index + 7).map(
                    (hour: number) => (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, '0')}:00
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700" htmlFor="booking-duration">
                Duración
              </label>
              <select
                className="h-11 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                id="booking-duration"
                onChange={(event) => setDurationHours(Number(event.target.value))}
                value={durationHours}
              >
                {availableDurations.map((duration: number) => (
                  <option key={duration} value={duration}>
                    {duration} {duration === 1 ? 'hora' : 'horas'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-end justify-between border-t border-emerald-100 pt-4">
            <div>
              <p className="text-xs text-slate-600">Total estimado</p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0,
                }).format(totalPrice)}
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Reservando…' : 'Confirmar reserva'}
              {!isSubmitting ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : null}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
