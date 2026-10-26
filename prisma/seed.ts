import { PrismaClient, Role, AuctionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Limpiar datos existentes respetando orden de relaciones
  await prisma.bid.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.auction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // 2. Hashear contraseñas
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10)
  const userPasswordHash = await bcrypt.hash('UserPassword123!', 10)

  // 3. Crear Usuarios
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bidhub.com',
      fullName: 'Administrador General',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  })

  const seller1 = await prisma.user.create({
    data: {
      email: 'carlos@bidhub.com',
      fullName: 'Carlos Vendedor',
      passwordHash: userPasswordHash,
      role: Role.USER,
    },
  })

  const bidder1 = await prisma.user.create({
    data: {
      email: 'maria@bidhub.com',
      fullName: 'María Coleccionista',
      passwordHash: userPasswordHash,
      role: Role.USER,
    },
  })

  const bidder2 = await prisma.user.create({
    data: {
      email: 'juan@bidhub.com',
      fullName: 'Juan Pérez',
      passwordHash: userPasswordHash,
      role: Role.USER,
    },
  })

  console.log('✅ Users created: admin, seller, bidders')

  // 4. Crear Categorías
  const catCartas = await prisma.category.create({
    data: { name: 'Cartas Coleccionables', slug: 'cartas-coleccionables' },
  })
  const catRelojes = await prisma.category.create({
    data: { name: 'Relojes Vintage', slug: 'relojes-vintage' },
  })
  const catVinilos = await prisma.category.create({
    data: { name: 'Vinilos & Música', slug: 'vinilos-musica' },
  })
  const catFiguras = await prisma.category.create({
    data: { name: 'Figuras de Acción', slug: 'figuras-accion' },
  })
  const catArte = await prisma.category.create({
    data: { name: 'Arte & Antigüedades', slug: 'arte-antiguedades' },
  })

  console.log('✅ Categories created')

  const now = new Date()

  // 5. Crear Subastas con distintos estados
  // 5.1. Subasta ACTIVA con ofertas
  const auctionActiveWithBids = await prisma.auction.create({
    data: {
      title: 'Charizard 1st Edition Shadowless PSA 9 (1999)',
      description: 'Carta auténtica Charizard Base Set primera edición graduada PSA 9 Mint. Estado impecable de conservación en caja acrílica sellada con holograma garantizado.',
      imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=1000&auto=format&fit=crop',
      initialPrice: 1200.0,
      minIncrement: 50.0,
      startsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
      closesAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),  // Cierra en 3 días
      status: AuctionStatus.ACTIVE,
      sellerId: seller1.id,
      categoryId: catCartas.id,
    },
  })

  // Ofertas en esta subasta activa
  await prisma.bid.create({
    data: {
      amount: 1250.0,
      bidderId: bidder1.id,
      auctionId: auctionActiveWithBids.id,
      createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
    },
  })
  await prisma.bid.create({
    data: {
      amount: 1350.0,
      bidderId: bidder2.id,
      auctionId: auctionActiveWithBids.id,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  })
  await prisma.bid.create({
    data: {
      amount: 1500.0,
      bidderId: bidder1.id,
      auctionId: auctionActiveWithBids.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  })

  // 5.2. Subasta ACTIVA sin ofertas
  await prisma.auction.create({
    data: {
      title: 'Omega Seamaster Cosmic 1968 Automático Calibre 565',
      description: 'Reloj vintage de manufactura suiza en acero inoxidable con esfera plateada tipo crosshair. Movimiento automático original con cambio rápido de fecha funcionando a la perfección.',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
      initialPrice: 850.0,
      minIncrement: 25.0,
      startsAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // Hace 6 horas
      closesAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // En 4 días
      status: AuctionStatus.ACTIVE,
      sellerId: seller1.id,
      categoryId: catRelojes.id,
    },
  })

  // 5.3. Subasta CERRADA con ganador
  const auctionClosed = await prisma.auction.create({
    data: {
      title: 'The Beatles - Abbey Road (1969 UK First Pressing)',
      description: 'Prensado original británico con la funda original sin crédito a Her Majesty. Vinilo VG+ probado y sin saltos con insert original.',
      imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1000&auto=format&fit=crop',
      initialPrice: 300.0,
      minIncrement: 20.0,
      startsAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      closesAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Cerró hace 1 día
      status: AuctionStatus.CLOSED,
      sellerId: seller1.id,
      categoryId: catVinilos.id,
    },
  })
  await prisma.bid.create({
    data: {
      amount: 320.0,
      bidderId: bidder1.id,
      auctionId: auctionClosed.id,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.bid.create({
    data: {
      amount: 420.0,
      bidderId: bidder2.id,
      auctionId: auctionClosed.id,
      createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
    },
  })

  // 5.4. Subasta DESIERTA (fecha cumplida sin ofertas)
  await prisma.auction.create({
    data: {
      title: 'Hot Toys Iron Man Mark VII Diecast Edición Especial 1/6',
      description: 'Figura de colección articulada de 32 cm con piezas de metal fundido y luces LED. Nueva en caja sellada con accesorios completos.',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop',
      initialPrice: 650.0,
      minIncrement: 30.0,
      startsAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      closesAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // Cerró hace 12 horas sin ofertas
      status: AuctionStatus.DESERTED,
      sellerId: seller1.id,
      categoryId: catFiguras.id,
    },
  })

  // 5.5. Subasta CANCELADA por Administrador con motivo
  await prisma.auction.create({
    data: {
      title: 'Moneda Antigua de Oro 8 Escudos Carlos IV 1799',
      description: 'Moneda colonial acuñada en ceca de México. Subasta cancelada por el equipo de moderación debido a solicitud de documentación de autenticidad adicional.',
      imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=1000&auto=format&fit=crop',
      initialPrice: 2200.0,
      minIncrement: 100.0,
      startsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      closesAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: AuctionStatus.CANCELLED,
      cancellationReason: 'Sospecha sobre autenticidad del artículo: no superó la certificación numismática requerida.',
      sellerId: seller1.id,
      categoryId: catArte.id,
    },
  })

  console.log('✅ Example auctions created in all states (ACTIVE, CLOSED, DESERTED, CANCELLED)')
  console.log('🌱 Seed finished successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
