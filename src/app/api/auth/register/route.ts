import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/lib/auth'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    // Validaciones
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Debe ingresar un correo electrónico válido' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Comprobar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'El correo electrónico ya se encuentra registrado' },
        { status: 409 }
      )
    }

    // Hashear contraseña y crear usuario
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: fullName?.trim() || null,
        passwordHash,
        role: Role.USER,
      },
    })

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

    // Guardar refresh token hasheado en BD
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    })

    // Configurar respuesta con cookies HttpOnly
    const response = NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    )

    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(false))
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(true))

    return response
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error)
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al registrar el usuario' },
      { status: 500 }
    )
  }
}
