import { NextRequest, NextResponse, connection } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComputedAuctionStatus } from '@/lib/auctions'

export async function GET(request: NextRequest) {
  try {
    await connection()
    const categoryId = request.nextUrl.searchParams.get('categoryId')
    const statusParam = request.nextUrl.searchParams.get('status')
    const query = request.nextUrl.searchParams.get('query')

    const where: any = {}

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId
    }

    if (query && query.trim().length > 0) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
      ]
    }

    const auctions = await prisma.auction.findMany({
      where,
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
        },
        _count: {
          select: { bids: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Mapear con estado calculado dinámico (Reglas 12 y 13)
    const formatted = auctions.map((auction) => {
      const computedStatus = getComputedAuctionStatus({
        status: auction.status,
        closesAt: auction.closesAt,
        bids: auction._count.bids,
      })

      const highestBid = auction.bids[0]?.amount ? Number(auction.bids[0].amount) : null
      const initialPrice = Number(auction.initialPrice)
      const currentPrice = highestBid ?? initialPrice

      return {
        id: auction.id,
        title: auction.title,
        description: auction.description,
        imageUrl: auction.imageUrl,
        initialPrice,
        minIncrement: Number(auction.minIncrement),
        currentPrice,
        highestBid,
        bidsCount: auction._count.bids,
        startsAt: auction.startsAt,
        closesAt: auction.closesAt,
        status: computedStatus,
        cancellationReason: auction.cancellationReason,
        category: auction.category,
        seller: {
          id: auction.seller.id,
          name: auction.seller.fullName || 'Vendedor',
        },
        createdAt: auction.createdAt,
      }
    })

    // Si se filtró por status, aplicar sobre el estado calculado
    const filtered = statusParam && statusParam !== 'all'
      ? formatted.filter((a) => a.status.toUpperCase() === statusParam.toUpperCase())
      : formatted

    return NextResponse.json({ auctions: filtered })
  } catch (error: any) {
    console.error('Error in GET /api/auctions:', error)
    return NextResponse.json(
      { error: 'Error al obtener el catálogo de subastas' },
      { status: 500 }
    )
  }
}
