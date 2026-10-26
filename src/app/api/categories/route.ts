import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { auctions: true },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error in GET /api/categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener las categorías' },
      { status: 500 }
    )
  }
}
