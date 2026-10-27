import type { User } from '@prisma/client'
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
      !('fullName' in body) ||
      typeof body.fullName !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Debe ingresar nombre, correo y contraseña' },
        { status: 400 }
      )
    }

    const email: string = body.email
    const password: string = body.password
    const fullName: string = body.fullName.trim()
    const normalizedEmail: string = email.toLowerCase().trim()

    if (fullName.length === 0) {
      return NextResponse.json(
        { error: 'Debe ingresar su nombre' },
        { status: 400 }
      )
    }

    if (!normalizedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Debe ingresar un correo electrónico válido' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const existing: User | null = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'El correo electrónico ya se encuentra registrado' },
        { status: 409 }
      )
    }

    const hashedPassword: string = await hashPassword(password)
    const user: User = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: fullName,
        password: hashedPassword,
        role: Role.USER,
      },
    })

    // Generar tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.name,
    })

    const refreshToken: string = await generateRefreshToken({ userId: user.id })
    const tokenHash: string = hashToken(refreshToken)
    const expiresAt: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

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
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al registrar el usuario' },
      { status: 500 }
    )
  }
}
