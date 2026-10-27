import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/errors'
import {
  hashToken,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const refreshToken: string | undefined = request.cookies.get(REFRESH_COOKIE_NAME)?.value

    if (refreshToken) {
      const tokenHash: string = hashToken(refreshToken)
      await prisma.refreshToken.updateMany({
        where: { tokenHash, isRevoked: false },
        data: { isRevoked: true },
      })
    }

    const response: NextResponse = NextResponse.json({
      message: 'Sesión cerrada correctamente',
    })

    response.cookies.set(ACCESS_COOKIE_NAME, '', {
      ...getCookieOptions(false),
      maxAge: 0,
    })
    response.cookies.set(REFRESH_COOKIE_NAME, '', {
      ...getCookieOptions(true),
      maxAge: 0,
    })

    return response
  } catch (error: unknown) {
    console.error('Error in /api/auth/logout:', error)
    return errorResponse(error)
  }
}
