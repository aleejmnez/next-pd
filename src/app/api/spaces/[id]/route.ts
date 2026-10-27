import type { Space } from '@prisma/client'
import { Role } from '@prisma/client'
import { NextResponse, type NextRequest } from 'next/server'
import { AppError, errorResponse } from '@/lib/errors'
import { getCurrentUser } from '@/lib/auth'
import {
  spaceIdSchema,
  spaceUpdateSchema,
  type SpaceUpdateInput,
} from '@/lib/validations'
import {
  deactivateSpace,
  getActiveSpaceById,
  updateSpace,
} from '@/services/space.service'

type SpaceRouteContext = {
  params: Promise<{ id: string }>
}

async function getSpaceId(context: SpaceRouteContext): Promise<string> {
  const params: { id: string } = await context.params
  const input = spaceIdSchema.parse(params)
  return input.id
}

async function requireAdmin(): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Debes iniciar sesión')
  }

  if (user.role !== Role.ADMIN) {
    throw new AppError('FORBIDDEN', 'Se requiere rol de administrador')
  }
}

export async function GET(
  _request: NextRequest,
  context: SpaceRouteContext
): Promise<NextResponse> {
  try {
    const id: string = await getSpaceId(context)
    const space: Space = await getActiveSpaceById(id)
    return NextResponse.json({ space })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: SpaceRouteContext
): Promise<NextResponse> {
  try {
    await requireAdmin()

    const id: string = await getSpaceId(context)
    const body: unknown = await request.json().catch((): undefined => undefined)
    const input: SpaceUpdateInput = spaceUpdateSchema.parse(body)
    const space: Space = await updateSpace(id, input)

    return NextResponse.json({ space })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  context: SpaceRouteContext
): Promise<NextResponse> {
  try {
    await requireAdmin()

    const id: string = await getSpaceId(context)
    const space: Space = await deactivateSpace(id)

    return NextResponse.json({ space })
  } catch (error: unknown) {
    return errorResponse(error)
  }
}