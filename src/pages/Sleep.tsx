import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, BedDouble, Moon, Sun, Star, Pause, Play } from 'lucide-react'
import { ActionButtons } from '../components/ui/ActionButtons'
import { useSleepStore } from '../store/sleepStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Timer } from '../components/common/Timer'
import { Drawer } from '../components/common/Drawer'
import { formatNetDuration, formatTime, resolveToISO, currentHHMM } from '../utils/formatTime'
import { pageVariants, listVariants, itemVariants } from '../utils/animations'
import type { SleepType, SleepRecord } from '../types'

type SleepTypeDef = {
  value: SleepType
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  iconBg: string
  iconColor: string
}

const SLEEP_TYPES: SleepTypeDef[] = [
  { value: 'nap', label: 'Дневной', Icon: Sun, iconBg: 'bg-amber-100', iconColor: 'text-amber-500' },
  { value: 'night', label: 'Ночной', Icon: Moon, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-500' },
]


export function Sleep() {
  const navigate = useNavigate()
  const { records, activeSleep, startSleep, stopSleep, pauseSleep, resumeSleep, addRecord, updateRecord, deleteRecord } = useSleepStore()

  const [startDrawerOpen, setStartDrawerOpen] = useState(false)
  const [stopDrawerOpen, setStopDrawerOpen] = useState(false)
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<SleepRecord | null>(null)
  const [selectedType, setSelectedType] = useState<SleepType>('nap')
  const [quality, setQuality] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [manualStartTime, setManualStartTime] = useState('')
  const [manualEndTime, setManualEndTime] = useState('')

  // Edit state
  const [editType, setEditType] = useState<SleepType>('nap')
  const [editQuality, setEditQuality] = useState<number>(0)
  const [editNotes, setEditNotes] = useState('')

  function openStartDrawer() {
    setManualStartTime(currentHHMM())
    setStartDrawerOpen(true)
  }

  function openManualDrawer() {
    setManualStartTime(currentHHMM())
    setManualEndTime(currentHHMM())
    setManualDrawerOpen(true)
  }

  function handleStart() {
    startSleep(selectedType, resolveToISO(manualStartTime))
    setStartDrawerOpen(false)
    toast.success('Укладываемся спать')
  }

  function handleStop() {
    stopSleep(quality || undefined, notes || undefined)
    setQuality(0)
    setNotes('')
    setStopDrawerOpen(false)
    toast.success('Сон сохранён')
  }

  function handleManualAdd() {
    addRecord({
      childId: 'nicole-001',
      type: selectedType,
      startTime: resolveToISO(manualStartTime),
      endTime: resolveToISO(manualEndTime),
      quality: quality || undefined,
      notes: notes || undefined,
    })
    setQuality(0)
    setNotes('')
    setManualDrawerOpen(false)
    toast.success('Запись добавлена')
  }

  function openEditDrawer(record: SleepRecord) {
    setEditRecord(record)
    setEditType(record.type)
    setEditQuality(record.quality ?? 0)
    setEditNotes(record.notes ?? '')
    setEditDrawerOpen(true)
  }

  function handleEditSave() {
    if (!editRecord) return
    updateRecord(editRecord.id, {
      type: editType,
      quality: editQuality || undefined,
      notes: editNotes || undefined,
    })
    setEditDrawerOpen(false)
    setEditRecord(null)
    toast.success('Запись обновлена')
  }

  function handleDelete(id: string) {
    deleteRecord(id)
    toast.error('Запись удалена')
  }

  const todayRecords = records.filter(
    (r) => new Date(r.startTime).toDateString() === new Date().toDateString()
  )

  const totalSleepMin = todayRecords.reduce((acc, r) => {
    if (!r.endTime) return acc
    const netMs = new Date(r.endTime).getTime() - new Date(r.startTime).getTime() - (r.pausedMs ?? 0)
    return acc + Math.floor(netMs / 60000)
  }, 0)

  const activeDef = activeSleep ? SLEEP_TYPES.find((t) => t.value === activeSleep.type)! : null

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="px-4 pb-24"
      >
        {/* Шапка */}
        <div className="pt-12 pb-4 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')} className="text-gray-400">
            <ChevronLeft size={24} />
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <BedDouble size={16} className="text-purple-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Сон</h1>
          </div>
        </div>

        {/* Статистика дня */}
        {totalSleepMin > 0 && (
          <motion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="flex gap-3 mb-4"
          >
            <motion.div variants={itemVariants} className="flex-1 bg-purple-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-purple-600">
                {Math.floor(totalSleepMin / 60)}ч {totalSleepMin % 60}м
              </p>
              <p className="text-xs text-purple-400">всего сегодня</p>
            </motion.div>
            <motion.div variants={itemVariants} className="flex-1 bg-indigo-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-indigo-600">{todayRecords.length}</p>
              <p className="text-xs text-indigo-400">раз поспала</p>
            </motion.div>
          </motion.div>
        )}

        {/* Активный сон */}
        {activeSleep && activeDef ? (
          <Card className="bg-purple-50 border-purple-200 mb-4">
            <div className="text-center py-4">
              <div className={`w-14 h-14 rounded-full ${activeDef.iconBg} flex items-center justify-center mx-auto mb-3`}>
                <activeDef.Icon size={26} className={activeDef.iconColor} />
              </div>
              <p className="text-sm text-purple-400 font-medium mb-2">
                {activeSleep.pausedAt
                  ? 'На паузе ⏸'
                  : activeSleep.type === 'night' ? 'Ночной сон' : 'Дневной сон'}
              </p>
              <Timer
                startTime={activeSleep.startTime}
                pausedMs={activeSleep.pausedMs}
                pausedAt={activeSleep.pausedAt}
                className="text-5xl font-bold text-purple-500"
                showPulse
                pulseColor="purple"
              />
              <p className="text-xs text-gray-400 mt-3">Засыпание в {formatTime(activeSleep.startTime)}</p>
            </div>
            <div className="space-y-2">
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={activeSleep.pausedAt ? resumeSleep : pauseSleep}
              >
                {activeSleep.pausedAt ? (
                  <span className="flex items-center justify-center gap-2"><Play size={18} />Продолжить</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Pause size={18} />Пауза</span>
                )}
              </Button>
              <Button
                fullWidth
                size="lg"
                className="bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => setStopDrawerOpen(true)}
              >
                Проснулась
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Начать отслеживание сна</p>
            <Button
              fullWidth
              size="lg"
              className="bg-purple-500 hover:bg-purple-600 text-white"
              onClick={openStartDrawer}
            >
              Укладываем спать
            </Button>
            <button
              onClick={openManualDrawer}
              className="w-full text-center text-xs text-gray-400 dark:text-gray-500 mt-3 hover:text-gray-600 dark:hover:text-gray-300 py-1"
            >
              + Добавить запись вручную
            </button>
          </Card>
        )}

        {/* История */}
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          Сегодня ({todayRecords.length})
        </p>
        {todayRecords.length === 0 ? (
          <p className="text-center text-gray-300 dark:text-gray-600 text-sm py-8">Нет записей</p>
        ) : (
          <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
            {todayRecords.map((r) => {
              const def = SLEEP_TYPES.find((t) => t.value === r.type)!
              return (
                <motion.div
                  key={r.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-purple-50 dark:border-gray-700 flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-full ${def.iconBg} flex items-center justify-center shrink-0`}>
                    <def.Icon size={16} className={def.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {r.type === 'night' ? 'Ночной сон' : 'Дневной сон'}
                      {r.quality ? (
                        <span className="ml-1 text-amber-400">{'★'.repeat(r.quality)}{'☆'.repeat(5 - r.quality)}</span>
                      ) : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(r.startTime)}
                      {r.endTime
                        ? ` → ${formatTime(r.endTime)} · ${formatNetDuration(r.startTime, r.endTime, r.pausedMs)}`
                        : ' · не завершён'}
                    </p>
                  </div>
                  <ActionButtons onEdit={() => openEditDrawer(r)} onDelete={() => handleDelete(r.id)} />
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Drawer: старт сна */}
      <Drawer open={startDrawerOpen} onClose={() => setStartDrawerOpen(false)} title="Начать сон">
        <div className="space-y-4 pb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Тип сна</p>
            <div className="flex gap-2">
              {SLEEP_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                    selectedType === t.value
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-600'
                      : 'border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${t.iconBg} flex items-center justify-center`}>
                    <t.Icon size={13} className={t.iconColor} />
                  </div>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Время начала</label>
            <input
              type="time"
              value={manualStartTime}
              onChange={(e) => setManualStartTime(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <Button
            fullWidth
            size="lg"
            className="bg-purple-500 hover:bg-purple-600 text-white"
            onClick={handleStart}
          >
            Начать отсчёт
          </Button>
        </div>
      </Drawer>

      {/* Drawer: вручную */}
      <Drawer open={manualDrawerOpen} onClose={() => setManualDrawerOpen(false)} title="Добавить вручную">
        <div className="space-y-4 pb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Тип сна</p>
            <div className="flex gap-2">
              {SLEEP_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                    selectedType === t.value
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-600'
                      : 'border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${t.iconBg} flex items-center justify-center`}>
                    <t.Icon size={13} className={t.iconColor} />
                  </div>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Начало</label>
              <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Конец</label>
              <input type="time" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-3">Оценка сна</p>
            <div className="flex justify-around">
              {[1, 2, 3, 4, 5].map((q) => (
                <motion.button
                  key={q}
                  onClick={() => setQuality(quality === q ? 0 : q)}
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: quality === q ? 1.2 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`transition-opacity ${quality >= q ? 'opacity-100' : 'opacity-30'}`}
                >
                  <Star size={32} className="text-amber-400" fill={quality >= q ? '#fbbf24' : 'none'} />
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Заметки</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Как спала?" rows={2}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
          </div>
          <Button fullWidth size="lg" className="bg-purple-500 hover:bg-purple-600 text-white" onClick={handleManualAdd}>
            Добавить запись
          </Button>
        </div>
      </Drawer>

      {/* Drawer: завершить сон */}
      <Drawer open={stopDrawerOpen} onClose={() => setStopDrawerOpen(false)} title="Проснулась">
        <div className="space-y-4 pb-2">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-3">Оценка сна</p>
            <div className="flex justify-around">
              {[1, 2, 3, 4, 5].map((q) => (
                <motion.button
                  key={q}
                  onClick={() => setQuality(q)}
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: quality === q ? 1.2 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`transition-opacity ${quality >= q ? 'opacity-100' : 'opacity-30'}`}
                >
                  <Star
                    size={32}
                    className="text-amber-400"
                    fill={quality >= q ? '#fbbf24' : 'none'}
                  />
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Заметки</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Как спала?"
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <Button
            fullWidth
            size="lg"
            className="bg-purple-500 hover:bg-purple-600 text-white"
            onClick={handleStop}
          >
            Сохранить
          </Button>
        </div>
      </Drawer>

      {/* Drawer: редактирование */}
      <Drawer open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} title="Редактировать запись">
        <div className="space-y-4 pb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Тип сна</p>
            <div className="flex gap-2">
              {SLEEP_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setEditType(t.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                    editType === t.value
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-600'
                      : 'border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${t.iconBg} flex items-center justify-center`}>
                    <t.Icon size={13} className={t.iconColor} />
                  </div>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-3">Оценка сна</p>
            <div className="flex justify-around">
              {[1, 2, 3, 4, 5].map((q) => (
                <motion.button
                  key={q}
                  onClick={() => setEditQuality(editQuality === q ? 0 : q)}
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: editQuality === q ? 1.2 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`transition-opacity ${editQuality >= q ? 'opacity-100' : 'opacity-30'}`}
                >
                  <Star size={32} className="text-amber-400" fill={editQuality >= q ? '#fbbf24' : 'none'} />
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Заметки</label>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Как спала?" rows={2}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
          </div>
          <Button fullWidth size="lg" className="bg-purple-500 hover:bg-purple-600 text-white" onClick={handleEditSave}>
            Сохранить
          </Button>
        </div>
      </Drawer>
    </>
  )
}
