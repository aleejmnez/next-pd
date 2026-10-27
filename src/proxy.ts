import { NextResponse, type NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

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

  if (!requiresUser) return NextResponse.next()

  const accessToken: string | undefined = request.cookies.get('bidhub_access_token')?.value
  const user = accessToken ? await verifyAccessToken(accessToken) : null

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (requiresAdmin && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/bookings/:path*', '/admin/:path*'],
}
