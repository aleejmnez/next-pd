import { Role } from '@prisma/client'
import { NextResponse, type NextRequest } from 'next/server'
import { AppError, errorResponse } from '@/lib/errors'
import { getCurrentUser } from '@/lib/auth'
import { bookingIdSchema } from '@/lib/validations'
import {
  cancelBooking,
  getBookingById,
  type BookingWithSpace,
} from '@/services/booking.service'

type BookingRouteContext = {
  params: Promise<{ id: string }>
}

async function getBookingId(context: BookingRouteContext): Promise<string> {
  const params: { id: string } = await context.params
  const input = bookingIdSchema.parse(params)
  return input.id
}

export async function GET(
  _request: NextRequest,
  context: BookingRouteContext
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión')
    }

    const id: string = await getBookingId(context)
    const isAdmin: boolean = user.role === Role.ADMIN
    const booking: BookingWithSpace = await getBookingById(id, user.userId, isAdmin)

    return NextResponse.json({ booking })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: BookingRouteContext
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión')
    }

    const id: string = await getBookingId(context)
    const isAdmin: boolean = user.role === Role.ADMIN
    const booking: BookingWithSpace = await cancelBooking(id, user.userId, isAdmin)

    return NextResponse.json({ booking })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}
