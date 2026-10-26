import { Auction, Bid, AuctionStatus } from '@prisma/client'

export type ComputedAuctionStatus = 'ACTIVE' | 'CLOSED' | 'DESERTED' | 'CANCELLED'

/**
 * Calcula el estado real de la subasta en tiempo de consulta (Reglas 12 y 13)
 * sin depender de cron jobs o tareas externas.
 */
export function getComputedAuctionStatus(auction: {
  status: AuctionStatus
  closesAt: Date | string
  bids?: { id: string }[] | number
}): ComputedAuctionStatus {
  // Si fue cancelada manualmente, prevalece CANCELLED
  if (auction.status === AuctionStatus.CANCELLED) {
    return 'CANCELLED'
  }

  const now = new Date()
  const closesAt = new Date(auction.closesAt)
  const isPastClosingDate = now >= closesAt

  if (!isPastClosingDate) {
    return 'ACTIVE'
  }

  // Ya pasó la fecha de cierre
  const bidsCount =
    typeof auction.bids === 'number'
      ? auction.bids
      : Array.isArray(auction.bids)
      ? auction.bids.length
      : 0

  if (bidsCount > 0) {
    return 'CLOSED'
  } else {
    return 'DESERTED'
  }
}

/**
 * Máscara de privacidad para postores (Regla de negocio 18)
 * Ejemplo: "María Coleccionista" -> "M***a", "carlos@bidhub.com" -> "c***s"
 */
export function maskBidderIdentifier(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim().length > 0) {
    const trimmed = fullName.trim()
    if (trimmed.length <= 2) return `${trimmed[0]}***`
    return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`
  }
  if (email && email.includes('@')) {
    const [userPart] = email.split('@')
    if (userPart.length <= 2) return `${userPart[0]}***`
    return `${userPart[0]}***${userPart[userPart.length - 1]}`
  }
  return 'Postor Anónimo'
}

/**
 * Formateo de moneda
 */
export function formatCurrency(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numeric)
}
