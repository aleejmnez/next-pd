import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    })
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Error al obtener la sesión' },
      { status: 500 }
    )
  }
}
