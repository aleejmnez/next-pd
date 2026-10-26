import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComputedAuctionStatus, maskBidderIdentifier, formatCurrency } from '@/lib/auctions'
import { CountdownTimer } from '@/components/common/CountdownTimer'
import {
  Gavel,
  ArrowLeft,
  Clock,
  Shield,
  Tag,
  User,
  History,
  Lock,
  LogIn,
  UserPlus,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
} from 'lucide-react'

interface AuctionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  await connection()
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
        orderBy: { amount: 'desc' },
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
    notFound()
  }

  // Estado calculado en tiempo de consulta (Reglas 12 y 13)
  const computedStatus = getComputedAuctionStatus({
    status: auction.status,
    closesAt: auction.closesAt,
    bids: auction.bids.length,
  })

  const initialPrice = Number(auction.initialPrice)
  const minIncrement = Number(auction.minIncrement)

  // Oferta ganadora / actual más alta
  const highestBidAmount = auction.bids.length > 0
    ? Math.max(...auction.bids.map((b) => Number(b.amount)))
    : null

  const currentPrice = highestBidAmount ?? initialPrice
  const minNextBid = highestBidAmount ? highestBidAmount + minIncrement : initialPrice

  const winningBid = auction.bids.length > 0 ? auction.bids[0] : null

  // Historial ordenado cronológicamente para mostrar la evolución
  const chronologicalBids = [...auction.bids].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const sellerName = maskBidderIdentifier(auction.seller.fullName, auction.seller.email)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/auctions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Público</span>
        </Link>
      </div>

      {/* Main Grid: Details & Bidding panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image & Description (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Article Image */}
          <div className="glass-panel rounded-3xl overflow-hidden border-slate-800 relative aspect-[16/11] bg-slate-900 shadow-2xl">
            {auction.imageUrl ? (
              <Image
                src={auction.imageUrl}
                alt={auction.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700">
                <Gavel className="w-20 h-20" />
              </div>
            )}

            {/* Badges on Image */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-950/85 backdrop-blur-md text-slate-200 border border-slate-700/60 shadow-lg">
                {auction.category.name}
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${
                  computedStatus === 'ACTIVE'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 backdrop-blur-md'
                    : computedStatus === 'CLOSED'
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50 backdrop-blur-md'
                    : computedStatus === 'CANCELLED'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 backdrop-blur-md'
                    : 'bg-amber-500/30 text-amber-300 border border-amber-500/50 backdrop-blur-md'
                }`}
              >
                {computedStatus === 'ACTIVE'
                  ? 'Subasta Activa'
                  : computedStatus === 'CLOSED'
                  ? 'Cerrada'
                  : computedStatus === 'CANCELLED'
                  ? 'Cancelada'
                  : 'Desierta'}
              </span>
            </div>
          </div>

          {/* Cancellation Notice if Cancelled (Regla 15: motivo obligatorio) */}
          {computedStatus === 'CANCELLED' && auction.cancellationReason && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-300">
                  Subasta Cancelada por Moderación
                </h4>
                <p className="text-xs text-rose-200/80 leading-relaxed">
                  <strong>Motivo de cancelación:</strong> {auction.cancellationReason}
                </p>
              </div>
            </div>
          )}

          {/* Winner Banner if Closed */}
          {computedStatus === 'CLOSED' && winningBid && (
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-300">Subasta Finalizada con Ganador</h4>
                  <p className="text-xs text-slate-300">
                    Ganador adjudicado: <strong className="text-amber-400">{maskBidderIdentifier(winningBid.bidder.fullName, winningBid.bidder.email)}</strong>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Monto final:</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {formatCurrency(Number(winningBid.amount))}
                </span>
              </div>
            </div>
          )}

          {/* Description & Specs */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Descripción del Artículo</h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {auction.description || 'El vendedor no proporcionó descripción adicional.'}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Vendedor
                </span>
                <p className="font-semibold text-slate-200">{sellerName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Publicación
                </span>
                <p className="font-semibold text-slate-200">
                  {new Date(auction.startsAt).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Cierre Estimado
                </span>
                <p className="font-semibold text-slate-200">
                  {new Date(auction.closesAt).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Live Countdown & Bid History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Pricing & Countdown Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                {auction.category.name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-snug">
                {auction.title}
              </h1>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {auction.bids.length > 0 ? 'Oferta más alta actual' : 'Precio base inicial'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {auction.bids.length} {auction.bids.length === 1 ? 'oferta' : 'ofertas'}
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-tight">
                {formatCurrency(currentPrice)}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div>
                  <span>Precio de salida:</span>
                  <p className="font-semibold text-slate-200">{formatCurrency(initialPrice)}</p>
                </div>
                <div>
                  <span>Incremento mínimo:</span>
                  <p className="font-semibold text-slate-200">+{formatCurrency(minIncrement)}</p>
                </div>
              </div>
            </div>

            {/* Live Countdown Clock */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Tiempo restante para el cierre:
              </span>
              <CountdownTimer
                closesAt={auction.closesAt}
                status={computedStatus}
              />
            </div>

            {/* Non-Interactive Public Notice & Disabled Bid Form */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-amber-300">Vista Pública de Solo Lectura</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Estás navegando en modo visitante. Puedes ver todos los datos en vivo, pero las ofertas e interacciones requieren autenticación.
                  </p>
                </div>
              </div>

              {/* Disabled Mock Input */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                  Próxima puja mínima válida: {formatCurrency(minNextBid)}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    disabled
                    placeholder={String(minNextBid)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloqueado</span>
                  </div>
                </div>
              </div>

              {/* CTA to Authenticate */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-500/10 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarme</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bids History (Regla de negocio 18: Sin correos ni nombres completos) */}
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Historial de Ofertas</h3>
              </div>
              <span className="text-[11px] text-slate-500">
                {chronologicalBids.length} registradas
              </span>
            </div>

            {chronologicalBids.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                <p>Aún no hay ofertas en esta subasta.</p>
                <p className="text-[11px] text-slate-600">
                  La primera oferta iniciará en {formatCurrency(initialPrice)}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1">
                {chronologicalBids.map((bid, index) => {
                  const bidderAlias = maskBidderIdentifier(
                    bid.bidder.fullName,
                    bid.bidder.email
                  )
                  const isTopBid = index === 0

                  return (
                    <div
                      key={bid.id}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] ${
                            isTopBid
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{chronologicalBids.length - index}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span>{bidderAlias}</span>
                            {isTopBid && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                                Más alta
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {new Date(bid.createdAt).toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-bold text-sm ${
                          isTopBid ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {formatCurrency(Number(bid.amount))}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-500 shrink-0" />
              <span>
                Identidad protegida según normativas de privacidad (alias cifrados).
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
