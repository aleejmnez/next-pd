import type { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError, errorResponse } from '@/lib/errors'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import {
  hashPassword,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json().catch((): undefined => undefined)
    const input: RegisterInput = registerSchema.parse(body)
    const normalizedEmail: string = input.email.toLowerCase()

    const existing: User | null = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      throw new AppError('CONFLICT', 'El correo electrónico ya se encuentra registrado')
    }

    const hashedPassword: string = await hashPassword(input.password)
    const user: User = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: input.fullName,
        password: hashedPassword,
        role: Role.USER,
      },
    })

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

    // Guardar refresh token hasheado en BD
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    })

    // Configurar respuesta con cookies HttpOnly
    const response: NextResponse = NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )

    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(false))
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(true))

    return response
  } catch (error: unknown) {
    console.error('Error in /api/auth/register:', error)
    return errorResponse(error)
  }
}
