import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface TimerProps {
  startTime: string
  className?: string
  showPulse?: boolean
}

function getElapsed(startTime: string): string {
  const totalSeconds = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function Timer({ startTime, className = '', showPulse = false }: TimerProps) {
  const [display, setDisplay] = useState(() => getElapsed(startTime))

  const tick = useCallback(() => {
    setDisplay(getElapsed(startTime))
  }, [startTime])

  useEffect(() => {
    tick()
    const interval = setInterval(tick, 1000)

    // При возврате из фона — мгновенно пересчитываем
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [tick])

  return (
    <div className="relative inline-flex items-center justify-center">
      {showPulse && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-pink-400 opacity-20"
            animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-pink-300 opacity-15"
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
        </>
      )}
      <motion.span
        className={`font-mono tabular-nums relative z-10 ${className}`}
        animate={showPulse ? { scale: [1, 1.03, 1] } : {}}
        transition={showPulse ? { duration: 1, repeat: Infinity } : {}}
      >
        {display}
      </motion.span>
    </div>
  )
}
