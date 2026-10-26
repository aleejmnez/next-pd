'use client'

import React, { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  closesAt: string | Date
  status: 'ACTIVE' | 'CLOSED' | 'DESERTED' | 'CANCELLED'
  compact?: boolean
}

export function CountdownTimer({ closesAt, status, compact = false }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    setMounted(true)

    function calculate() {
      const difference = new Date(closesAt).getTime() - new Date().getTime()
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
    }

    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [closesAt])

  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        Subasta Cancelada
      </span>
    )
  }

  if (status === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        Subasta Cerrada
      </span>
    )
  }

  if (status === 'DESERTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        Finalizada sin ofertas
      </span>
    )
  }

  // Prevención de error de hidratación (Requisito 10): Mostrar placeholder neutral hasta montar en cliente
  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Clock className="w-3.5 h-3.5 animate-spin text-amber-400/60" />
        <span>Calculando tiempo...</span>
      </div>
    )
  }

  if (timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Tiempo finalizado
      </span>
    )
  }

  if (compact) {
    const isUrgent = timeLeft.days === 0 && timeLeft.hours < 2
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
          isUrgent
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse'
            : 'bg-slate-800/80 border-slate-700/60 text-amber-300'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    )
  }

  // Vista expandida para página de detalle
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-inner">
        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{timeLeft.days}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Días</div>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-inner">
        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{String(timeLeft.hours).padStart(2, '0')}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Horas</div>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-inner">
        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{String(timeLeft.minutes).padStart(2, '0')}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Minutos</div>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-inner">
        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Segundos</div>
      </div>
    </div>
  )
}
