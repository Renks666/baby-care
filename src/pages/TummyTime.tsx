import { motion } from 'framer-motion'
import { FlipVertical2, Play, Square, Trash2 } from 'lucide-react'
import { useTummyStore } from '../store/tummyStore'
import { Timer } from '../components/common/Timer'
import { formatDuration, formatTime } from '../utils/formatTime'
import { pageVariants } from '../utils/animations'
import { toast } from 'sonner'

const GOAL_MIN = 30

function formatMins(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

export function TummyTime() {
  const { records, activeTummy, startTummy, stopTummy, deleteRecord, getToday } = useTummyStore()

  const todaySessions = getToday()
  const totalTodayMin = todaySessions.reduce((acc, r) => {
    if (!r.endTime) return acc
    return acc + Math.floor(
      (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000
    )
  }, 0)
  const goalPercent = Math.min(100, Math.round((totalTodayMin / GOAL_MIN) * 100))
  const goalReached = totalTodayMin >= GOAL_MIN

  function handleStart() {
    startTummy()
    toast.success('Время на животике началось')
  }

  function handleStop() {
    stopTummy()
    toast.success('Сессия сохранена')
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <FlipVertical2 size={16} className="text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Время на животике</h1>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 ml-10">Цель: {GOAL_MIN} мин в день</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Активный таймер / Кнопка старт */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-orange-100 dark:border-gray-700 p-6 flex flex-col items-center">
          {activeTummy ? (
            <>
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 animate-pulse">
                <FlipVertical2 size={32} className="text-orange-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Идёт сессия</p>
              <Timer startTime={activeTummy.startTime} className="text-4xl font-bold text-orange-500 mb-6" showPulse={false} />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-md"
              >
                <Square size={16} fill="white" />
                Завершить
              </motion.button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                <FlipVertical2 size={32} className="text-orange-300" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center">
                Положи Николь на животик<br />и запусти таймер
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-md"
              >
                <Play size={16} fill="white" />
                Начать
              </motion.button>
            </>
          )}
        </div>

        {/* Прогресс дня */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Сегодня</p>
            <span className={`text-sm font-bold ${goalReached ? 'text-green-500' : 'text-orange-500'}`}>
              {formatMins(totalTodayMin)} / {GOAL_MIN} мин
            </span>
          </div>
          <div className="h-2.5 bg-orange-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${goalReached ? 'bg-green-400' : 'bg-orange-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${goalPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{todaySessions.length} сессий</span>
            {goalReached
              ? <span className="text-green-500 font-medium">✓ Цель достигнута!</span>
              : <span>{GOAL_MIN - totalTodayMin} мин до цели</span>
            }
          </div>
        </div>

        {/* История сегодня */}
        {todaySessions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Сегодня</p>
            <div className="space-y-2">
              {todaySessions.map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-orange-50 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <FlipVertical2 size={15} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {formatTime(r.startTime)}{r.endTime ? ` – ${formatTime(r.endTime)}` : ' · идёт'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {r.endTime ? formatDuration(r.startTime, r.endTime) : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => { deleteRecord(r.id); toast('Запись удалена') }}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* История всех дней */}
        {records.filter((r) => new Date(r.startTime).toDateString() !== new Date().toDateString()).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Ранее</p>
            <div className="space-y-2">
              {records
                .filter((r) => new Date(r.startTime).toDateString() !== new Date().toDateString())
                .slice(0, 10)
                .map((r) => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-50 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                      <FlipVertical2 size={15} className="text-orange-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {new Date(r.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        {' · '}
                        {formatTime(r.startTime)}{r.endTime ? ` – ${formatTime(r.endTime)}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {r.endTime ? formatDuration(r.startTime, r.endTime) : '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
