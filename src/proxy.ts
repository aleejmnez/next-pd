import { NextResponse, type NextRequest } from 'next/server'
import { ACCESS_COOKIE_NAME, verifyAccessToken } from '@/lib/auth'

function isPathOrChild(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname: string = request.nextUrl.pathname
  const requiresAdmin: boolean = isPathOrChild(pathname, '/admin')
  const requiresUser: boolean =
    requiresAdmin ||
    isPathOrChild(pathname, '/dashboard') ||
    isPathOrChild(pathname, '/bookings')
  const isAuthPage: boolean =
    pathname === '/login' ||
    pathname === '/register'

  const accessToken: string | undefined = request.cookies.get(ACCESS_COOKIE_NAME)?.value
  const user = accessToken ? await verifyAccessToken(accessToken) : null

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/spaces', request.url))
  }

  if (!requiresUser) return NextResponse.next()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (requiresAdmin && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
