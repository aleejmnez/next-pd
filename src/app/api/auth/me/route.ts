import { NextResponse } from 'next/server'
import { AppError, errorResponse } from '@/lib/errors'
import { getCurrentUser, type TokenPayload } from '@/lib/auth'

export async function GET(): Promise<NextResponse> {
  try {
    const user: TokenPayload | null = await getCurrentUser()
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'No hay una sesión activa')
    }

    return NextResponse.json({
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    })
  } catch (error: unknown) {
    console.error('Error in /api/auth/me:', error)
    return errorResponse(error)
  }
}
