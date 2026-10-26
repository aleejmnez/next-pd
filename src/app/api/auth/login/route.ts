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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Debe ingresar correo y contraseña' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const isMatch = await verifyPassword(password, user.passwordHash)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generar tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    })

    const refreshToken = await generateRefreshToken({ userId: user.id })
    const tokenHash = hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Almacenar refresh token hasheado en BD
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    })

    const response = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    })

    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(false))
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(true))

    return response
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error)
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al iniciar sesión' },
      { status: 500 }
    )
  }
}
