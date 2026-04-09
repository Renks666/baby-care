import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

type PulseColor = 'pink' | 'purple' | 'green' | 'amber'

const PULSE_COLORS: Record<PulseColor, { outer: string; inner: string }> = {
  pink:   { outer: 'bg-pink-400',   inner: 'bg-pink-300' },
  purple: { outer: 'bg-purple-400', inner: 'bg-purple-300' },
  green:  { outer: 'bg-green-400',  inner: 'bg-green-300' },
  amber:  { outer: 'bg-amber-400',  inner: 'bg-amber-300' },
}

interface TimerProps {
  startTime: string
  pausedMs?: number  // суммарное время всех пауз в мс
  pausedAt?: string  // ISO — если задано, таймер на паузе прямо сейчас
  className?: string
  showPulse?: boolean
  pulseColor?: PulseColor
}

function getElapsed(startTime: string, pausedMs = 0, pausedAt?: string): string {
  const now = Date.now()
  const currentPause = pausedAt ? now - new Date(pausedAt).getTime() : 0
  const totalSeconds = Math.max(
    0,
    Math.floor((now - new Date(startTime).getTime() - pausedMs - currentPause) / 1000)
  )
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function Timer({ startTime, pausedMs, pausedAt, className = '', showPulse = false, pulseColor = 'pink' }: TimerProps) {
  const isPaused = Boolean(pausedAt)

  const [display, setDisplay] = useState(() => getElapsed(startTime, pausedMs, pausedAt))

  const tick = useCallback(() => {
    setDisplay(getElapsed(startTime, pausedMs, pausedAt))
  }, [startTime, pausedMs, pausedAt])

  useEffect(() => {
    tick()
    if (isPaused) return // не тикаем пока на паузе

    const interval = setInterval(tick, 1000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [tick, isPaused])

  const activePulse = showPulse && !isPaused
  const pulse = PULSE_COLORS[pulseColor]

  return (
    <div className="relative inline-flex items-center justify-center">
      {activePulse && (
        <>
          <motion.div
            className={`absolute inset-0 rounded-full ${pulse.outer} opacity-20`}
            animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className={`absolute inset-0 rounded-full ${pulse.inner} opacity-15`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
        </>
      )}
      <motion.span
        className={`font-mono tabular-nums relative z-10 ${className}`}
        animate={activePulse ? { scale: [1, 1.03, 1] } : {}}
        transition={activePulse ? { duration: 1, repeat: Infinity } : {}}
      >
        {display}
      </motion.span>
    </div>
  )
}
