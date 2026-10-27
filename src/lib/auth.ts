import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'

type TokenLifetime = {
  value: string
  seconds: number
}

function getJwtSecret(environmentName: string): Uint8Array {
  const secret: string | undefined = process.env[environmentName]

  if (!secret || secret.length < 32) {
    throw new Error(`${environmentName} debe tener al menos 32 caracteres`)
  }

  return new TextEncoder().encode(secret)
}

function getTokenLifetime(environmentName: string): TokenLifetime {
  const value: string | undefined = process.env[environmentName]
  const match: RegExpExecArray | null = value
    ? /^([1-9]\d*)(s|m|h|d)$/.exec(value)
    : null

  if (!value || !match) {
    throw new Error(`${environmentName} debe usar un formato como 15m o 7d`)
  }

  const amount: number = Number(match[1])
  const unit: string = match[2]
  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  }
  const seconds: number = amount * secondsPerUnit[unit]

  if (!Number.isSafeInteger(seconds)) {
    throw new Error(`${environmentName} está fuera de rango`)
  }

  return { value, seconds }
}

export const ACCESS_COOKIE_NAME = 'bidhub_access_token'
export const REFRESH_COOKIE_NAME = 'bidhub_refresh_token'

export interface TokenPayload {
  userId: string
  email: string
  role: Role
  fullName?: string | null
}

// Hashear contraseñas
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Comparar contraseñas
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Hashear refresh token para guardado seguro en la base de datos (Requisito 7)
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Crear Access Token (15 minutos)
export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const lifetime: TokenLifetime = getTokenLifetime('ACCESS_TOKEN_EXPIRES_IN')
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(lifetime.value)
    .sign(getJwtSecret('JWT_ACCESS_SECRET'))
}

// Crear Refresh Token (7 días)
export async function generateRefreshToken(payload: { userId: string }): Promise<string> {
  const lifetime: TokenLifetime = getTokenLifetime('REFRESH_TOKEN_EXPIRES_IN')
  const randomJti: string = crypto.randomUUID()
  return new SignJWT({ userId: payload.userId, jti: randomJti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(lifetime.value)
    .sign(getJwtSecret('JWT_REFRESH_SECRET'))
}

// Verificar Access Token
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret('JWT_ACCESS_SECRET'))
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

// Verificar Refresh Token
export async function verifyRefreshToken(token: string): Promise<{ userId: string; jti?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret('JWT_REFRESH_SECRET'))
    return payload as unknown as { userId: string; jti?: string }
  } catch {
    return null
  }
}

// Opciones de Cookie seguras (Requisito 7: httpOnly, secure, sameSite)
export function getRefreshTokenExpiresAt(): Date {
  const lifetime: TokenLifetime = getTokenLifetime('REFRESH_TOKEN_EXPIRES_IN')
  return new Date(Date.now() + lifetime.seconds * 1000)
}

export function getCookieOptions(isRefresh: boolean = false) {
  const environmentName: string = isRefresh
    ? 'REFRESH_TOKEN_EXPIRES_IN'
    : 'ACCESS_TOKEN_EXPIRES_IN'
  const lifetime: TokenLifetime = getTokenLifetime(environmentName)
  const isProduction: boolean = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: lifetime.seconds,
  }
}

// Obtener usuario autenticado actual desde cookies en Server Components / Route Handlers
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value

  if (!accessToken) return null

  return verifyAccessToken(accessToken)
}
