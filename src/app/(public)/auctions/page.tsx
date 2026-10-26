import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComputedAuctionStatus, formatCurrency } from '@/lib/auctions'
import { CountdownTimer } from '@/components/common/CountdownTimer'
import {
  Gavel,
  Filter,
  Search,
  Eye,
  Info,
  Clock,
  LogIn,
  AlertCircle,
  Tag,
} from 'lucide-react'

interface AuctionsPageProps {
  searchParams: Promise<{
    categoryId?: string
    status?: string
    query?: string
  }>
}

export default async function AuctionsCatalogPage({ searchParams }: AuctionsPageProps) {
  await connection()
  const { categoryId, status, query } = await searchParams

  // Cargar categorías para los filtros
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  // Filtro de base de datos
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

  const rawAuctions = await prisma.auction.findMany({
    where,
    include: {
      category: true,
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

  // Computar estado dinámico real (Reglas 12 y 13)
  const computedAuctions = rawAuctions.map((auction) => {
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
      closesAt: auction.closesAt.toISOString(),
      status: computedStatus,
      category: auction.category,
      createdAt: auction.createdAt,
    }
  })

  // Filtrar en memoria por status si aplica
  const auctions = status && status !== 'all'
    ? computedAuctions.filter((a) => a.status.toUpperCase() === status.toUpperCase())
    : computedAuctions

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'ACTIVE', label: 'Activas' },
    { value: 'CLOSED', label: 'Cerradas' },
    { value: 'DESERTED', label: 'Desiertas' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Banner */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Catálogo de Subastas
            </h1>
            <p className="text-sm text-slate-400">
              Explora artículos de colección con seguimiento de ofertas en tiempo real
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Modo solo lectura: Acceso público</span>
          </div>
        </div>

        {/* Public Notice Banner */}
        <div className="p-4 rounded-xl glass-panel border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Puedes ver libremente el catálogo, descripciones e historial de ofertas sin registrarte. Para pujar o publicar, debes iniciar sesión.
            </span>
          </div>
          <Link
            href="/login"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-4">
        <form method="GET" action="/auctions" className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="query"
              defaultValue={query || ''}
              placeholder="Buscar por título o descripción..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Category Select */}
          <div className="sm:col-span-3">
            <select
              name="categoryId"
              defaultValue={categoryId || 'all'}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="sm:col-span-2">
            <select
              name="status"
              defaultValue={status || 'all'}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar</span>
            </button>
            {(categoryId || status || query) && (
              <Link
                href="/auctions"
                className="px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
                title="Limpiar filtros"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Mostrando <strong className="text-white">{auctions.length}</strong> subastas encontradas
        </span>
      </div>

      {/* Auctions Grid */}
      {auctions.length === 0 ? (
        <div className="py-20 glass-panel rounded-2xl text-center space-y-3">
          <Gavel className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No se encontraron subastas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Prueba ajustando los filtros de categoría, estado o la búsqueda para ver otros resultados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="glass-panel rounded-2xl overflow-hidden flex flex-col border border-slate-800/80 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group"
            >
              {/* Image & Badges */}
              <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                {auction.imageUrl ? (
                  <Image
                    src={auction.imageUrl}
                    alt={auction.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Gavel className="w-12 h-12" />
                  </div>
                )}

                {/* Category Pill */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/85 backdrop-blur-md text-slate-200 border border-slate-700/50">
                  {auction.category.name}
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      auction.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : auction.status === 'CLOSED'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : auction.status === 'CANCELLED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {auction.status === 'ACTIVE'
                      ? 'Activa'
                      : auction.status === 'CLOSED'
                      ? 'Cerrada'
                      : auction.status === 'CANCELLED'
                      ? 'Cancelada'
                      : 'Desierta'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {auction.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {auction.description || 'Sin descripción detallada.'}
                  </p>
                </div>

                {/* Pricing Details */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Oferta más alta:</span>
                    <span className="font-extrabold text-amber-400 text-base font-mono">
                      {formatCurrency(auction.currentPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Precio base: {formatCurrency(auction.initialPrice)}</span>
                    <span>Inc. mín: +{formatCurrency(auction.minIncrement)}</span>
                  </div>
                </div>

                {/* Countdown and Bid Count */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400 font-medium">
                    {auction.bidsCount} {auction.bidsCount === 1 ? 'oferta' : 'ofertas'}
                  </span>
                  <CountdownTimer
                    closesAt={auction.closesAt}
                    status={auction.status}
                    compact
                  />
                </div>

                {/* Action Button: Public Detail */}
                <Link
                  href={`/auctions/${auction.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-amber-400 hover:text-slate-950 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Información y Ofertas</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
