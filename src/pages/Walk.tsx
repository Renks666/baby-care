import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Footprints, Play, Square, Plus, ChevronLeft } from 'lucide-react'
import { ActionButtons } from '../components/ui/ActionButtons'
import { useWalkStore } from '../store/walkStore'
import { Timer } from '../components/common/Timer'
import { Drawer } from '../components/common/Drawer'
import { formatDuration, formatTime } from '../utils/formatTime'
import { pageVariants } from '../utils/animations'
import { toast } from 'sonner'

const GOAL_MIN = 60

function formatMins(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

function resolveToISO(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  if (date.getTime() > Date.now() + 60_000) {
    date.setDate(date.getDate() - 1)
  }
  return date.toISOString()
}

export function Walk() {
  const navigate = useNavigate()
  const { records, activeWalk, startWalk, stopWalk, addRecord, deleteRecord, getToday } = useWalkStore()

  const [startDrawerOpen, setStartDrawerOpen] = useState(false)
  const [stopDrawerOpen, setStopDrawerOpen] = useState(false)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)

  const [manualStart, setManualStart] = useState('')
  const [stopNotes, setStopNotes] = useState('')
  const [addStart, setAddStart] = useState('')
  const [addEnd, setAddEnd] = useState('')
  const [addNotes, setAddNotes] = useState('')

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
    startWalk(manualStart ? resolveToISO(manualStart) : undefined)
    setManualStart('')
    setStartDrawerOpen(false)
    toast.success('Прогулка началась')
  }

  function handleStop() {
    stopWalk(stopNotes.trim() || undefined)
    setStopNotes('')
    setStopDrawerOpen(false)
    toast.success('Прогулка сохранена')
  }

  function handleAdd() {
    if (!addStart || !addEnd) {
      toast.error('Укажи время начала и конца')
      return
    }
    addRecord({
      childId: 'nicole-001',
      startTime: resolveToISO(addStart),
      endTime: resolveToISO(addEnd),
      notes: addNotes.trim() || undefined,
    })
    setAddStart('')
    setAddEnd('')
    setAddNotes('')
    setAddDrawerOpen(false)
    toast.success('Прогулка добавлена')
  }

  const inputCls = 'border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 w-full'
  const labelCls = 'text-xs text-gray-500 dark:text-gray-400 mb-1'

  const pastRecords = records.filter(
    (r) => new Date(r.startTime).toDateString() !== new Date().toDateString()
  )

  return (
    <>
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 -ml-1">
            <ChevronLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Footprints size={16} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Прогулка</h1>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 ml-10">Цель: {GOAL_MIN} мин в день</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Активный таймер / Кнопка старт */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-green-100 dark:border-gray-700 p-6 flex flex-col items-center">
          {activeWalk ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 animate-pulse">
                <Footprints size={32} className="text-green-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Идёт прогулка</p>
              <Timer startTime={activeWalk.startTime} className="text-4xl font-bold text-green-500 mb-6" showPulse={false} />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStopDrawerOpen(true)}
                className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-md"
              >
                <Square size={16} fill="white" />
                Завершить
              </motion.button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <Footprints size={32} className="text-green-300" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center">
                Выйди на прогулку с Николь<br />и запусти таймер
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStartDrawerOpen(true)}
                className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-2xl font-semibold text-sm shadow-md"
              >
                <Play size={16} fill="white" />
                Начать
              </motion.button>
            </>
          )}
        </div>

        {/* Прогресс дня */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-green-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Сегодня</p>
            <span className={`text-sm font-bold ${goalReached ? 'text-green-500' : 'text-green-400'}`}>
              {formatMins(totalTodayMin)} / {GOAL_MIN} мин
            </span>
          </div>
          <div className="h-2.5 bg-green-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${goalReached ? 'bg-green-500' : 'bg-green-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${goalPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{todaySessions.length} прогулок</span>
            {goalReached
              ? <span className="text-green-500 font-medium">✓ Цель достигнута!</span>
              : <span>{GOAL_MIN - totalTodayMin} мин до цели</span>
            }
          </div>
        </div>

        {/* Кнопка ручного добавления */}
        <button
          onClick={() => setAddDrawerOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-green-300 dark:border-green-800 text-sm text-green-500 dark:text-green-400 font-medium"
        >
          <Plus size={15} />
          Добавить вручную
        </button>

        {/* История сегодня */}
        {todaySessions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Сегодня</p>
            <div className="space-y-2">
              {todaySessions.map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-green-50 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Footprints size={15} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {formatTime(r.startTime)}{r.endTime ? ` – ${formatTime(r.endTime)}` : ' · идёт'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {r.endTime ? formatDuration(r.startTime, r.endTime) : '—'}
                      {r.notes ? ` · ${r.notes}` : ''}
                    </p>
                  </div>
                  <ActionButtons onDelete={() => { deleteRecord(r.id); toast('Запись удалена') }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* История прошлых дней */}
        {pastRecords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Ранее</p>
            <div className="space-y-2">
              {pastRecords.slice(0, 10).map((r) => (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-50 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                    <Footprints size={15} className="text-green-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {new Date(r.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {formatTime(r.startTime)}{r.endTime ? ` – ${formatTime(r.endTime)}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {r.endTime ? formatDuration(r.startTime, r.endTime) : '—'}
                      {r.notes ? ` · ${r.notes}` : ''}
                    </p>
                  </div>
                  <ActionButtons onDelete={() => deleteRecord(r.id)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>

    {/* StartDrawer */}
    <Drawer open={startDrawerOpen} onClose={() => setStartDrawerOpen(false)} title="Начать прогулку">
      <div className="space-y-4 pb-2">
        <div>
          <p className={labelCls}>Время начала (необязательно)</p>
          <input
            type="time"
            value={manualStart}
            onChange={(e) => setManualStart(e.target.value)}
            className={inputCls}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Оставь пустым, чтобы начать сейчас</p>
        </div>
        <button
          onClick={handleStart}
          className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Начать
        </button>
      </div>
    </Drawer>

    {/* StopDrawer */}
    <Drawer open={stopDrawerOpen} onClose={() => setStopDrawerOpen(false)} title="Завершить прогулку">
      <div className="space-y-4 pb-2">
        <div>
          <p className={labelCls}>Заметка</p>
          <textarea
            value={stopNotes}
            onChange={(e) => setStopNotes(e.target.value)}
            placeholder="Как прошла прогулка?"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
        <button
          onClick={handleStop}
          className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Сохранить
        </button>
      </div>
    </Drawer>

    {/* AddDrawer */}
    <Drawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)} title="Добавить прогулку">
      <div className="space-y-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={labelCls}>Начало</p>
            <input
              type="time"
              value={addStart}
              onChange={(e) => setAddStart(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <p className={labelCls}>Конец</p>
            <input
              type="time"
              value={addEnd}
              onChange={(e) => setAddEnd(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <p className={labelCls}>Заметка</p>
          <textarea
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
            placeholder="Как прошла прогулка?"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>
        <button
          onClick={handleAdd}
          className="w-full bg-green-500 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Добавить
        </button>
      </div>
    </Drawer>
    </>
  )
}
