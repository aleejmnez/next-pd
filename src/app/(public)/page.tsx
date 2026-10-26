import React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getComputedAuctionStatus, formatCurrency } from '@/lib/auctions'
import { CountdownTimer } from '@/components/common/CountdownTimer'
import {
  Gavel,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react'


async function getFeaturedAuctions() {
  try {
    const auctions = await prisma.auction.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
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
    })

    return auctions.map((a) => {
      const computedStatus = getComputedAuctionStatus({
        status: a.status,
        closesAt: a.closesAt,
        bids: a._count.bids,
      })
      const highestBid = a.bids[0]?.amount ? Number(a.bids[0].amount) : null
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        imageUrl: a.imageUrl,
        initialPrice: Number(a.initialPrice),
        currentPrice: highestBid ?? Number(a.initialPrice),
        bidsCount: a._count.bids,
        closesAt: a.closesAt.toISOString(),
        status: computedStatus,
        category: a.category.name,
      }
    })
  } catch {
    return []
  }
}

async function getCategories() {
  try {
    return await prisma.category.findMany({
      include: {
        _count: { select: { auctions: true } },
      },
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageFallback() {
  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Subastas Exclusivas de{' '}
              <span className="gradient-text-gold">Coleccionables</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Descubre cartas raras, relojes históricos, vinilos de primera edición y piezas de museo.
              Navega en modo público con total transparencia de ofertas y estados en tiempo real.
            </p>
            <p className="text-sm text-slate-400" role="status">
              Cargando subastas destacadas...
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

async function HomePageContent() {
  const [featuredAuctions, categories] = await Promise.all([
    getFeaturedAuctions(),
    getCategories(),
  ])

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Ambient Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-400/10 border border-amber-400/25 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Plataforma Premier de Subastas en Vivo</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Subastas Exclusivas de{' '}
              <span className="gradient-text-gold">Coleccionables</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Descubre cartas raras, relojes históricos, vinilos de primera edición y piezas de museo.
              Navega en modo público con total transparencia de ofertas y estados en tiempo real.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auctions"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <Gavel className="w-4 h-4" />
                <span>Explorar Catálogo Público</span>
              </Link>

              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <span>Crear Cuenta para Ofertar</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Public Mode Notice Banner */}
            <div className="mt-8 p-4 rounded-2xl glass-panel max-w-xl mx-auto border-amber-500/20 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-200">
                  Visualización Abierta (Modo Espectador)
                </p>
                <p className="text-slate-400">
                  Cualquier usuario puede ver detalles, precios e historial de ofertas. Para participar como postor o publicar tus artículos, ingresa con tu cuenta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Auctions Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1">
              <TrendingUp className="w-4 h-4" /> En Tendencia
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Subastas Destacadas
            </h2>
            <p className="text-sm text-slate-400">
              Artículos destacados con ofertas activas y seguimiento en vivo
            </p>
          </div>

          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Ver todas las subastas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredAuctions.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl text-slate-400">
            No hay subastas registradas por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredAuctions.map((auction) => (
              <div
                key={auction.id}
                className="group glass-panel rounded-2xl overflow-hidden flex flex-col hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
              >
                {/* Image & Badges */}
                <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                  {auction.imageUrl ? (
                    <Image
                      src={auction.imageUrl}
                      alt={auction.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Gavel className="w-12 h-12" />
                    </div>
                  )}

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700/50">
                    {auction.category}
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        auction.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : auction.status === 'CLOSED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : auction.status === 'CANCELLED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {auction.status === 'ACTIVE' ? 'Activa' : auction.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {auction.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {auction.description || 'Sin descripción disponible.'}
                    </p>
                  </div>

                  {/* Price & Countdown */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Oferta actual:</span>
                      <span className="font-bold text-amber-400 text-sm font-mono">
                        {formatCurrency(auction.currentPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        {auction.bidsCount} {auction.bidsCount === 1 ? 'oferta' : 'ofertas'}
                      </span>
                      <CountdownTimer
                        closesAt={auction.closesAt}
                        status={auction.status}
                        compact
                      />
                    </div>
                  </div>

                  {/* Public View Action */}
                  <Link
                    href={`/auctions/${auction.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalles Públicos</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Explora por Categorías
          </h2>
          <p className="text-sm text-slate-400">
            Encuentra artículos verificados clasificados por coleccionistas
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/auctions?categoryId=${cat.id}`}
              className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center gap-2 hover:border-amber-500/40 hover:-translate-y-1 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">
                {cat.name}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {cat._count.auctions} {cat._count.auctions === 1 ? 'artículo' : 'artículos'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it Works / Transparency Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border-slate-800/80 relative overflow-hidden">
          <div className="max-w-3xl space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Reglas y Funcionamiento
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Cómo Funciona la Plataforma BidHub
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Diseñado bajo estrictas reglas de negocio para asegurar una experiencia limpia, transparente y libre de manipulaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Regla de Oferta Más Alta</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Cada oferta debe superar la mayor oferta previa más el incremento mínimo fijado por el vendedor.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Extensión por Último Minuto</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Si se recibe una oferta a menos de 5 minutos del cierre, el tiempo se extiende automáticamente 5 minutos más.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Privacidad del Postor</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    En el catálogo público nunca se revelan correos ni nombres completos; se muestran alias anonimizados.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Modo Espectador Abierto</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Puedes consultar todas las subastas e históricos sin necesidad de ingresar sesión.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
