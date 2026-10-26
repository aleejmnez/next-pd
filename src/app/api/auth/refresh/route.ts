import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyRefreshToken,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No se proporcionó refresh token' },
        { status: 401 }
      )
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Refresh token inválido o expirado' },
        { status: 401 }
      )
    }

    const tokenHash = hashToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token revocado o no encontrado' },
        { status: 401 }
      )
    }

    // Rotación de refresh token (revocar el anterior y crear uno nuevo)
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const newAccessToken = await generateAccessToken({
      userId: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      fullName: stored.user.fullName,
    })

    const newRefreshToken = await generateRefreshToken({ userId: stored.user.id })
    const newTokenHash = hashToken(newRefreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: stored.user.id,
        expiresAt,
      },
    })

    const response = NextResponse.json({
      message: 'Token renovado con éxito',
      user: {
        id: stored.user.id,
        email: stored.user.email,
        fullName: stored.user.fullName,
        role: stored.user.role,
      },
    })

    response.cookies.set(ACCESS_COOKIE_NAME, newAccessToken, getCookieOptions(false))
    response.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, getCookieOptions(true))

    return response
  } catch (error: any) {
    console.error('Error in /api/auth/refresh:', error)
    return NextResponse.json(
      { error: 'Error al renovar sesión' },
      { status: 500 }
    )
  }
}
