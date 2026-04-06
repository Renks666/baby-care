import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { formatDuration } from '../../utils/formatTime'

interface TimerProps {
  startTime: string
  className?: string
  showPulse?: boolean
}

export function Timer({ startTime, className = '', showPulse = false }: TimerProps) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

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
        {formatDuration(startTime)}
      </motion.span>
    </div>
  )
}
