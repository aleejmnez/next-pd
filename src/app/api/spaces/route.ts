import type { Space } from '@prisma/client'
import { Role } from '@prisma/client'
import { NextResponse, type NextRequest } from 'next/server'
import { AppError, errorResponse } from '@/lib/errors'
import { getCurrentUser } from '@/lib/auth'
import { spaceCreateSchema, type SpaceCreateInput } from '@/lib/validations'
import { createSpace, listSpaces } from '@/services/space.service'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const includeInactive: boolean =
      request.nextUrl.searchParams.get('includeInactive') === 'true'

    if (includeInactive) {
      const user = await getCurrentUser()

      if (!user) {
        throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión')
      }

      if (user.role !== Role.ADMIN) {
        throw new AppError('FORBIDDEN', 'Se requiere rol de administrador')
      }
    }

    const spaces: Space[] = await listSpaces(includeInactive)
    return NextResponse.json({ spaces })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión')
    }

    if (user.role !== Role.ADMIN) {
      throw new AppError('FORBIDDEN', 'Se requiere rol de administrador')
    }

    const body: unknown = await request.json().catch((): undefined => undefined)
    const input: SpaceCreateInput = spaceCreateSchema.parse(body)
    const space: Space = await createSpace(input)

    return NextResponse.json({ space }, { status: 201 })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}