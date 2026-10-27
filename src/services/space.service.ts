import { BookingStatus, Prisma, type Space } from '@prisma/client'
import { AppError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'
import type { SpaceCreateInput, SpaceUpdateInput } from '@/lib/validations'

export async function listActiveSpaces(): Promise<Space[]> {
  return listSpaces(false)
}

export async function listSpaces(includeInactive: boolean = false): Promise<Space[]> {
  return prisma.space.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export async function createSpace(input: SpaceCreateInput): Promise<Space> {
  return prisma.space.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      capacity: input.capacity,
      pricePerHour: input.pricePerHour,
      imageUrl: input.imageUrl ?? null,
      isActive: input.isActive ?? true,
    },
  })
}

export async function getActiveSpaceById(id: string): Promise<Space> {
  const space: Space | null = await prisma.space.findFirst({
    where: { id, isActive: true },
  })

  if (!space) {
    throw new AppError('NOT_FOUND', 'No se encontró el espacio')
  }

  return space
}

export async function updateSpace(
  id: string,
  input: SpaceUpdateInput
): Promise<Space> {
  const existingSpace: Space | null = await prisma.space.findUnique({
    where: { id },
  })

  if (!existingSpace) {
    throw new AppError('NOT_FOUND', 'No se encontró el espacio')
  }

  return prisma.space.update({
    where: { id },
    data: input,
  })
}

export async function deactivateSpace(id: string): Promise<Space> {
  return prisma.$transaction(
    async (transaction: Prisma.TransactionClient): Promise<Space> => {
      const space: Space | null = await transaction.space.findUnique({
        where: { id },
      })

      if (!space) {
        throw new AppError('NOT_FOUND', 'No se encontró el espacio')
      }

      if (!space.isActive) return space

      const now: Date = new Date()
      const futureBookingCount: number = await transaction.booking.count({
        where: {
          spaceId: id,
          status: BookingStatus.CONFIRMED,
          startTime: { gt: now },
        },
      })

      if (futureBookingCount > 0) {
        throw new AppError(
          'CONFLICT',
          'No se puede desactivar un espacio con reservas futuras confirmadas'
        )
      }

      return transaction.space.update({
        where: { id },
        data: { isActive: false },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}