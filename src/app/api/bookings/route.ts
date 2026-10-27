import { NextResponse, type NextRequest } from 'next/server'
import { AppError, errorResponse } from '@/lib/errors'
import { getCurrentUser } from '@/lib/auth'
import { bookingCreateSchema, type BookingCreateInput } from '@/lib/validations'
import {
  createBooking,
  listUserBookings,
  type BookingWithSpace,
} from '@/services/booking.service'

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión')
    }

    const bookings: BookingWithSpace[] = await listUserBookings(user.userId)
    return NextResponse.json({ bookings })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión')
    }

    const body: unknown = await request.json().catch((): undefined => undefined)
    const input: BookingCreateInput = bookingCreateSchema.parse(body)
    const booking: BookingWithSpace = await createBooking(user.userId, input)

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}
