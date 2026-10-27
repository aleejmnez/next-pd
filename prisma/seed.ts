import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

type SpaceSeed = {
  name: string
  description: string
  capacity: number
  pricePerHour: number
  imageUrl: string
  isActive: boolean
}

const prisma: PrismaClient = new PrismaClient()
const adminEmail: string = 'admin@cospace.com'
const spaces: SpaceSeed[] = [
  {
    name: 'Escritorio flexible',
    description: 'Puesto individual con silla ergonómica e iluminación natural.',
    capacity: 1,
    pricePerHour: 8000,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
    isActive: true,
  },
  {
    name: 'Sala de reuniones ejecutiva',
    description: 'Sala privada con pantalla, pizarra y equipo para videollamadas.',
    capacity: 8,
    pricePerHour: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407',
    isActive: true,
  },
  {
    name: 'Cabina acústica',
    description: 'Espacio insonorizado para llamadas y reuniones individuales.',
    capacity: 1,
    pricePerHour: 10000,
    imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4',
    isActive: true,
  },
  {
    name: 'Oficina privada',
    description: 'Oficina equipada para trabajo concentrado o reuniones pequeñas.',
    capacity: 4,
    pricePerHour: 22000,
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
    isActive: true,
  },
  {
    name: 'Sala colaborativa',
    description: 'Área amplia para talleres, sesiones de equipo y lluvia de ideas.',
    capacity: 12,
    pricePerHour: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
    isActive: true,
  },
  {
    name: 'Puesto en zona compartida',
    description: 'Puesto de trabajo en un ambiente compartido y cómodo.',
    capacity: 1,
    pricePerHour: 7000,
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
    isActive: true,
  },
]

async function seedSpace(space: SpaceSeed): Promise<void> {
  const existingSpace: { id: string } | null = await prisma.space.findFirst({
    where: { name: space.name },
    select: { id: true },
  })

  if (existingSpace) {
    await prisma.space.update({
      where: { id: existingSpace.id },
      data: space,
    })
    return
  }

  await prisma.space.create({ data: space })
}

async function main(): Promise<void> {
  const adminPassword: string | undefined = process.env.COSPACE_SEED_ADMIN_PASSWORD

  if (!adminPassword) {
    throw new Error('Configura COSPACE_SEED_ADMIN_PASSWORD antes de ejecutar el seed.')
  }

  if (adminPassword.length < 12) {
    throw new Error('COSPACE_SEED_ADMIN_PASSWORD debe tener al menos 12 caracteres.')
  }

  const hashedPassword: string = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Administrador CoSpace',
      password: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      name: 'Administrador CoSpace',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  for (const space of spaces) {
    await seedSpace(space)
  }

  console.log(`Admin disponible: ${adminEmail}`)
  console.log(`Espacios cargados: ${spaces.length}`)
}

main()
  .catch((error: unknown) => {
    console.error('Error ejecutando el seed:', error)
    process.exitCode = 1
  })
  .finally(async (): Promise<void> => {
    await prisma.$disconnect()
  })
