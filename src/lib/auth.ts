import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'default-access-secret-bidhub-2026-minimum-32-chars'
)
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-bidhub-2026-minimum-32-chars'
)

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
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET)
}

// Crear Refresh Token (7 días)
export async function generateRefreshToken(payload: { userId: string }): Promise<string> {
  const randomJti = crypto.randomUUID()
  return new SignJWT({ userId: payload.userId, jti: randomJti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_SECRET)
}

// Verificar Access Token
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

// Verificar Refresh Token
export async function verifyRefreshToken(token: string): Promise<{ userId: string; jti?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET)
    return payload as unknown as { userId: string; jti?: string }
  } catch {
    return null
  }
}

// Opciones de Cookie seguras (Requisito 7: httpOnly, secure, sameSite)
export function getCookieOptions(isRefresh = false) {
  const isProduction = process.env.NODE_ENV === 'production'
  const maxAge = isRefresh ? 7 * 24 * 60 * 60 : 15 * 60 // 7 días vs 15 minutos

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

// Obtener usuario autenticado actual desde cookies en Server Components / Route Handlers
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken)
    if (payload) return payload
  }

  // Si el access token expiró pero hay refresh token, intentar renovar
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value
  if (!refreshToken) return null

  const refreshPayload = await verifyRefreshToken(refreshToken)
  if (!refreshPayload) return null

  const tokenHash = hashToken(refreshToken)
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    return null
  }

  const user = storedToken.user
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  }
}
