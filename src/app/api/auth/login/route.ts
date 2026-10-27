import type { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyPassword,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()

    if (
      typeof body !== 'object' ||
      body === null ||
      !('email' in body) ||
      typeof body.email !== 'string' ||
      !('password' in body) ||
      typeof body.password !== 'string' ||
      body.email.trim().length === 0 ||
      body.password.length === 0
    ) {
      return NextResponse.json(
        { error: 'Debe ingresar correo y contraseña' },
        { status: 400 }
      )
    }

    const email: string = body.email
    const password: string = body.password
    const normalizedEmail: string = email.toLowerCase().trim()

    const user: User | null = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const isMatch: boolean = await verifyPassword(password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generar tokens
    const accessToken: string = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.name,
    })

    const refreshToken: string = await generateRefreshToken({ userId: user.id })
    const tokenHash: string = hashToken(refreshToken)
    const expiresAt: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

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
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al iniciar sesión' },
      { status: 500 }
    )
  }
}
