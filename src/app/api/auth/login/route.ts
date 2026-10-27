import type { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError, errorResponse } from '@/lib/errors'
import { loginSchema } from '@/lib/validations'
import {
  verifyPassword,
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
    const body: unknown = await request.json().catch((): undefined => undefined)
    const input = loginSchema.parse(body)
    const normalizedEmail: string = input.email

    const user: User | null = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) throw new AppError('UNAUTHORIZED', 'Credenciales inválidas')

    const isMatch: boolean = await verifyPassword(input.password, user.password)
    if (!isMatch) throw new AppError('UNAUTHORIZED', 'Credenciales inválidas')

    // Generar tokens
    const accessToken: string = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.name,
    })

    const refreshToken: string = await generateRefreshToken({ userId: user.id })
    const tokenHash: string = hashToken(refreshToken)
    const expiresAt: Date = getRefreshTokenExpiresAt()

    // Almacenar refresh token hasheado en BD
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    })

    const response: NextResponse = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        role: user.role,
      },
    })

    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(false))
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(true))

    return response
  } catch (error: unknown) {
    console.error('Error in /api/auth/login:', error)
    return errorResponse(error)
  }
}
