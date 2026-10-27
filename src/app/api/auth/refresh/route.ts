import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError, errorResponse } from '@/lib/errors'
import {
  verifyRefreshToken,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const refreshToken: string | undefined = request.cookies.get(REFRESH_COOKIE_NAME)?.value

    if (!refreshToken) {
      throw new AppError('UNAUTHORIZED', 'No se proporcionó refresh token')
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      throw new AppError('UNAUTHORIZED', 'Refresh token inválido o expirado')
    }

    const tokenHash: string = hashToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!stored || stored.isRevoked || stored.expiresAt <= new Date()) {
      throw new AppError('UNAUTHORIZED', 'Token revocado o no encontrado')
    }

    const newAccessToken: string = await generateAccessToken({
      userId: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      fullName: stored.user.name,
    })

    const newRefreshToken: string = await generateRefreshToken({ userId: stored.user.id })
    const newTokenHash: string = hashToken(newRefreshToken)
    const expiresAt: Date = getRefreshTokenExpiresAt()

    const rotated: boolean = await prisma.$transaction(
      async (transaction: Prisma.TransactionClient): Promise<boolean> => {
        const revoked = await transaction.refreshToken.updateMany({
          where: { id: stored.id, isRevoked: false },
          data: { isRevoked: true },
        })

        if (revoked.count !== 1) return false

        await transaction.refreshToken.create({
          data: {
            tokenHash: newTokenHash,
            userId: stored.user.id,
            expiresAt,
          },
        })

        return true
      }
    )

    if (!rotated) {
      throw new AppError('UNAUTHORIZED', 'El refresh token ya fue utilizado')
    }

    const response: NextResponse = NextResponse.json({
      message: 'Token renovado con éxito',
      user: {
        id: stored.user.id,
        email: stored.user.email,
        fullName: stored.user.name,
        role: stored.user.role,
      },
    })

    response.cookies.set(ACCESS_COOKIE_NAME, newAccessToken, getCookieOptions(false))
    response.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, getCookieOptions(true))

    return response
  } catch (error: unknown) {
    console.error('Error in /api/auth/refresh:', error)
    return errorResponse(error)
  }
}
