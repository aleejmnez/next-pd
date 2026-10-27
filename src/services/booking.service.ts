import { BookingStatus, Prisma, type Space } from '@prisma/client'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import type { BookingCreateInput } from '@/lib/validations'

export type BookingWithSpace = Prisma.BookingGetPayload<{
  include: { space: true }
}>

type ColombiaTimeParts = {
  hour: number
  minute: number
  second: number
}

const millisecondsPerHour: number = 60 * 60 * 1000
const millisecondsPerDay: number = 24 * millisecondsPerHour
const colombiaTimeFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Bogota',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function getColombiaTimeParts(date: Date): ColombiaTimeParts {
  const parts: Intl.DateTimeFormatPart[] = colombiaTimeFormatter.formatToParts(date)
  const hourPart: Intl.DateTimeFormatPart | undefined = parts.find(
    (part: Intl.DateTimeFormatPart): boolean => part.type === 'hour'
  )
  const minutePart: Intl.DateTimeFormatPart | undefined = parts.find(
    (part: Intl.DateTimeFormatPart): boolean => part.type === 'minute'
  )
  const secondPart: Intl.DateTimeFormatPart | undefined = parts.find(
    (part: Intl.DateTimeFormatPart): boolean => part.type === 'second'
  )

  if (!hourPart || !minutePart || !secondPart) {
    throw new AppError('INTERNAL_ERROR', 'No se pudo interpretar la hora de Colombia')
  }

  return {
    hour: Number(hourPart.value),
    minute: Number(minutePart.value),
    second: Number(secondPart.value),
  }
}

function validateBookingTime(startTime: Date, endTime: Date): number {
  const startMilliseconds: number = startTime.getTime()
  const endMilliseconds: number = endTime.getTime()

  if (!Number.isFinite(startMilliseconds) || !Number.isFinite(endMilliseconds)) {
    throw new AppError('BAD_REQUEST', 'Las fechas de la reserva no son válidas')
  }

  const durationMilliseconds: number = endMilliseconds - startMilliseconds
  const durationHours: number = durationMilliseconds / millisecondsPerHour

  if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > 4) {
    throw new AppError('BAD_REQUEST', 'La duración debe ser de 1 a 4 horas completas')
  }

  if (
    startTime.getUTCMilliseconds() !== 0 ||
    endTime.getUTCMilliseconds() !== 0
  ) {
    throw new AppError('BAD_REQUEST', 'La reserva no puede incluir fracciones de segundo')
  }

  const startColombiaTime: ColombiaTimeParts = getColombiaTimeParts(startTime)
  const endColombiaTime: ColombiaTimeParts = getColombiaTimeParts(endTime)

  if (
    startColombiaTime.minute !== 0 ||
    startColombiaTime.second !== 0 ||
    endColombiaTime.minute !== 0 ||
    endColombiaTime.second !== 0 ||
    startColombiaTime.hour < 7 ||
    startColombiaTime.hour >= 21 ||
    endColombiaTime.hour > 21
  ) {
    throw new AppError('BAD_REQUEST', 'Las reservas deben estar entre las 7:00 y las 21:00 de Colombia')
  }

  return durationHours
}

export async function listUserBookings(userId: string): Promise<BookingWithSpace[]> {
  return prisma.booking.findMany({
    where: { userId },
    include: { space: true },
    orderBy: { startTime: 'asc' },
  })
}

export async function createBooking(
  userId: string,
  input: BookingCreateInput
): Promise<BookingWithSpace> {
  const startTime: Date = new Date(input.startTime)
  const endTime: Date = new Date(input.endTime)
  const durationHours: number = validateBookingTime(startTime, endTime)

  try {
    return await prisma.$transaction(
      async (transaction: Prisma.TransactionClient): Promise<BookingWithSpace> => {
        const now: Date = new Date()

        if (startTime.getTime() <= now.getTime()) {
          throw new AppError('BAD_REQUEST', 'La reserva no puede comenzar en el pasado')
        }

        if (startTime.getTime() > now.getTime() + 30 * millisecondsPerDay) {
          throw new AppError('BAD_REQUEST', 'No se puede reservar con más de 30 días de anticipación')
        }

        const space: Space | null = await transaction.space.findUnique({
          where: { id: input.spaceId },
        })

        if (!space) {
          throw new AppError('NOT_FOUND', 'No se encontró el espacio')
        }

        if (!space.isActive) {
          throw new AppError('CONFLICT', 'El espacio no está disponible')
        }

        const futureBookings: number = await transaction.booking.count({
          where: {
            userId,
            status: BookingStatus.CONFIRMED,
            startTime: { gt: now },
          },
        })

        if (futureBookings >= 3) {
          throw new AppError('CONFLICT', 'Ya tienes el máximo de 3 reservas futuras confirmadas')
        }

        const overlappingUserBooking: { id: string } | null = await transaction.booking.findFirst({
          where: {
            userId,
            status: BookingStatus.CONFIRMED,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { id: true },
        })

        if (overlappingUserBooking) {
          throw new AppError('CONFLICT', 'Ya tienes una reserva confirmada en ese horario')
        }

        const overlappingSpaceBooking: { id: string } | null = await transaction.booking.findFirst({
          where: {
            spaceId: space.id,
            status: BookingStatus.CONFIRMED,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { id: true },
        })

        if (overlappingSpaceBooking) {
          throw new AppError('CONFLICT', 'El espacio ya está reservado en ese horario')
        }

        const totalPrice: number = durationHours * space.pricePerHour

        return transaction.booking.create({
          data: {
            userId,
            spaceId: space.id,
            startTime,
            endTime,
            totalPrice,
          },
          include: { space: true },
        })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new AppError('CONFLICT', 'La reserva entró en conflicto con otra operación; inténtalo de nuevo')
    }

    throw error
  }
}

function getBookingOwnerFilter(
  id: string,
  userId: string,
  isAdmin: boolean
): Prisma.BookingWhereInput {
  if (isAdmin) return { id }
  return { id, userId }
}

export async function getBookingById(
  id: string,
  userId: string,
  isAdmin: boolean
): Promise<BookingWithSpace> {
  const booking: BookingWithSpace | null = await prisma.booking.findFirst({
    where: getBookingOwnerFilter(id, userId, isAdmin),
    include: { space: true },
  })

  if (!booking) {
    throw new AppError('NOT_FOUND', 'No se encontró la reserva')
  }

  return booking
}

export async function cancelBooking(
  id: string,
  userId: string,
  isAdmin: boolean
): Promise<BookingWithSpace> {
  try {
    return await prisma.$transaction(
      async (transaction: Prisma.TransactionClient): Promise<BookingWithSpace> => {
        const booking: BookingWithSpace | null = await transaction.booking.findFirst({
          where: getBookingOwnerFilter(id, userId, isAdmin),
          include: { space: true },
        })

        if (!booking) {
          throw new AppError('NOT_FOUND', 'No se encontró la reserva')
        }

        if (booking.status !== BookingStatus.CONFIRMED) {
          throw new AppError('CONFLICT', 'La reserva ya fue cancelada')
        }

        const now: Date = new Date()
        const cancellationDeadline: number =
          booking.startTime.getTime() - 2 * millisecondsPerHour

        if (!isAdmin && now.getTime() > cancellationDeadline) {
          throw new AppError(
            'CONFLICT',
            'Solo puedes cancelar hasta 2 horas antes del inicio'
          )
        }

        const updateResult: Prisma.BatchPayload = await transaction.booking.updateMany({
          where: {
            id,
            userId: isAdmin ? undefined : userId,
            status: BookingStatus.CONFIRMED,
          },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledAt: now,
          },
        })

        if (updateResult.count !== 1) {
          throw new AppError('CONFLICT', 'La reserva cambió mientras se cancelaba')
        }

        const cancelledBooking: BookingWithSpace | null = await transaction.booking.findUnique({
          where: { id },
          include: { space: true },
        })

        if (!cancelledBooking) {
          throw new AppError('NOT_FOUND', 'No se encontró la reserva')
        }

        return cancelledBooking
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new AppError('CONFLICT', 'La reserva cambió mientras se cancelaba')
    }

    throw error
  }
}
