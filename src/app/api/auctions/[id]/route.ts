import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComputedAuctionStatus, maskBidderIdentifier } from '@/lib/auctions'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auction = await prisma.auction.findUnique({
      where: { id },
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
          orderBy: { createdAt: 'desc' },
          include: {
            bidder: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!auction) {
      return NextResponse.json(
        { error: 'Subasta no encontrada' },
        { status: 404 }
      )
    }

    const computedStatus = getComputedAuctionStatus({
      status: auction.status,
      closesAt: auction.closesAt,
      bids: auction.bids.length,
    })

    const initialPrice = Number(auction.initialPrice)
    const minIncrement = Number(auction.minIncrement)
    
    // Calcular oferta más alta
    const highestBidAmount = auction.bids.length > 0
      ? Math.max(...auction.bids.map((b) => Number(b.amount)))
      : null

    const currentPrice = highestBidAmount ?? initialPrice
    const minNextBid = highestBidAmount
      ? highestBidAmount + minIncrement
      : initialPrice

    // Postor ganador si está cerrada
    const winningBid = auction.bids.reduce((prev, curr) => {
      return Number(curr.amount) > Number(prev.amount) ? curr : prev
    }, auction.bids[0])

    // Historial de ofertas con privacidad garantizada (Regla de negocio 18)
    const publicBidsHistory = auction.bids.map((bid) => ({
      id: bid.id,
      amount: Number(bid.amount),
      createdAt: bid.createdAt,
      bidderAlias: maskBidderIdentifier(bid.bidder.fullName, bid.bidder.email),
      isWinning: winningBid && winningBid.id === bid.id,
    }))

    return NextResponse.json({
      auction: {
        id: auction.id,
        title: auction.title,
        description: auction.description,
        imageUrl: auction.imageUrl,
        initialPrice,
        minIncrement,
        currentPrice,
        highestBid: highestBidAmount,
        minNextBid,
        startsAt: auction.startsAt,
        closesAt: auction.closesAt,
        status: computedStatus,
        cancellationReason: auction.cancellationReason,
        category: auction.category,
        seller: {
          id: auction.seller.id,
          name: maskBidderIdentifier(auction.seller.fullName, auction.seller.email),
        },
        bidsCount: auction.bids.length,
        bidsHistory: publicBidsHistory,
        winner: computedStatus === 'CLOSED' && winningBid
          ? {
              alias: maskBidderIdentifier(winningBid.bidder.fullName, winningBid.bidder.email),
              amount: Number(winningBid.amount),
            }
          : null,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/auctions/[id]:', error)
    return NextResponse.json(
      { error: 'Error al consultar el detalle de la subasta' },
      { status: 500 }
    )
  }
}
