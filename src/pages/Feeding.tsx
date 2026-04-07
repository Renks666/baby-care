import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, Trash2, Milk, Baby, FlaskConical, Utensils } from 'lucide-react'
import { useFeedingStore } from '../store/feedingStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Timer } from '../components/common/Timer'
import { Drawer } from '../components/common/Drawer'
import { formatDuration, formatTime } from '../utils/formatTime'
import { pageVariants, listVariants, itemVariants } from '../utils/animations'
import type { FeedingType, BreastSide } from '../types'

type FeedingDef = {
  value: FeedingType
  label: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  iconBg: string
  iconColor: string
}

const TYPES: FeedingDef[] = [
  { value: 'breast', label: 'Грудь', Icon: Milk, iconBg: 'bg-pink-100', iconColor: 'text-pink-500' },
  { value: 'bottle', label: 'Смесь', Icon: Baby, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
  { value: 'pumped', label: 'Сцеженное', Icon: FlaskConical, iconBg: 'bg-purple-100', iconColor: 'text-purple-500' },
  { value: 'solid', label: 'Прикорм', Icon: Utensils, iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
]

const SIDES: { value: BreastSide; label: string }[] = [
  { value: 'left', label: '← Левая' },
  { value: 'right', label: 'Правая →' },
  { value: 'both', label: '← Обе →' },
]

function FeedingIcon({ type, size = 18 }: { type: FeedingType; size?: number }) {
  const def = TYPES.find((t) => t.value === type)!
  return (
    <div className={`w-9 h-9 rounded-full ${def.iconBg} flex items-center justify-center shrink-0`}>
      <def.Icon size={size} className={def.iconColor} />
    </div>
  )
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

function currentHHMM(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function Feeding() {
  const navigate = useNavigate()
  const { records, activeFeeding, startFeeding, stopFeeding, addRecord, deleteRecord } = useFeedingStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stopDrawerOpen, setStopDrawerOpen] = useState(false)
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)

  const [selectedType, setSelectedType] = useState<FeedingType>('breast')
  const [selectedSide, setSelectedSide] = useState<BreastSide>('left')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [manualStartTime, setManualStartTime] = useState('')
  const [manualEndTime, setManualEndTime] = useState('')

  function openStartDrawer() {
    setManualStartTime(currentHHMM())
    setDrawerOpen(true)
  }

  function openManualDrawer() {
    setManualStartTime(currentHHMM())
    setManualEndTime(currentHHMM())
    setManualDrawerOpen(true)
  }

  function handleStart() {
    startFeeding(selectedType, selectedType === 'breast' ? selectedSide : undefined, resolveToISO(manualStartTime))
    setDrawerOpen(false)
    toast.success('Таймер запущен')
  }

  function handleStop() {
    stopFeeding(amount ? parseFloat(amount) : undefined, notes || undefined)
    setAmount('')
    setNotes('')
    setStopDrawerOpen(false)
    toast.success('Кормление сохранено')
  }

  function handleManualAdd() {
    addRecord({
      childId: 'nicole-001',
      type: selectedType,
      startTime: resolveToISO(manualStartTime),
      endTime: resolveToISO(manualEndTime),
      side: selectedType === 'breast' ? selectedSide : undefined,
      amount: amount ? parseFloat(amount) : undefined,
      notes: notes || undefined,
    })
    setAmount('')
    setNotes('')
    setManualDrawerOpen(false)
    toast.success('Запись добавлена')
  }

  function handleDelete(id: string) {
    deleteRecord(id)
    toast.error('Запись удалена')
  }

  const todayRecords = records.filter(
    (r) => new Date(r.startTime).toDateString() === new Date().toDateString()
  )

  const activeDef = activeFeeding ? TYPES.find((t) => t.value === activeFeeding.type)! : null

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="px-4 pb-24"
      >
        <div className="pt-12 pb-4 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')} className="text-gray-400">
            <ChevronLeft size={24} />
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
              <Milk size={16} className="text-pink-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Кормление</h1>
          </div>
        </div>

        {activeFeeding && activeDef ? (
          <Card className="bg-pink-50 border-pink-200 mb-4">
            <div className="text-center py-4">
              <div className={`w-14 h-14 rounded-full ${activeDef.iconBg} flex items-center justify-center mx-auto mb-3`}>
                <activeDef.Icon size={26} className={activeDef.iconColor} />
              </div>
              <p className="text-sm text-pink-400 font-medium mb-2">Кормление идёт</p>
              <Timer startTime={activeFeeding.startTime} className="text-5xl font-bold text-pink-500" showPulse />
              <p className="text-sm text-gray-500 mt-3">
                {activeDef.label}
                {activeFeeding.side ? ` · ${SIDES.find((s) => s.value === activeFeeding.side)?.label}` : ''}
              </p>
            </div>
            <Button fullWidth size="lg" onClick={() => setStopDrawerOpen(true)}>
              Завершить кормление
            </Button>
          </Card>
        ) : (
          <Card className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Начать кормление</p>
            <Button fullWidth size="lg" onClick={openStartDrawer}>
              Начать таймер
            </Button>
            <button
              onClick={openManualDrawer}
              className="w-full text-center text-xs text-gray-400 dark:text-gray-500 mt-3 hover:text-gray-600 dark:hover:text-gray-300 py-1"
            >
              + Добавить запись вручную
            </button>
          </Card>
        )}

        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          Сегодня ({todayRecords.length})
        </p>
        {todayRecords.length === 0 ? (
          <p className="text-center text-gray-300 dark:text-gray-600 text-sm py-8">Нет записей</p>
        ) : (
          <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
            {todayRecords.map((r) => {
              const def = TYPES.find((t) => t.value === r.type)!
              return (
                <motion.div
                  key={r.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-pink-50 dark:border-gray-700 flex items-center gap-3"
                >
                  <FeedingIcon type={r.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {def.label}
                      {r.side ? ` · ${SIDES.find((s) => s.value === r.side)?.label}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(r.startTime)}
                      {r.endTime ? ` · ${formatDuration(r.startTime, r.endTime)}` : ''}
                      {r.amount ? ` · ${r.amount} мл` : ''}
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDelete(r.id)} className="text-gray-300 hover:text-red-400 p-1">
                    <Trash2 size={15} />
                  </motion.button>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Drawer: старт */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Начать кормление">
        <div className="space-y-4 pb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Тип кормления</p>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    selectedType === t.value ? 'border-pink-400 bg-pink-50 dark:bg-pink-950' : 'border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${t.iconBg} flex items-center justify-center`}>
                    <t.Icon size={16} className={t.iconColor} />
                  </div>
                  <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          {selectedType === 'breast' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Сторона</p>
              <div className="flex gap-2">
                {SIDES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSide(s.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                      selectedSide === s.value ? 'border-pink-400 bg-pink-50 dark:bg-pink-950 text-pink-600' : 'border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(selectedType === 'bottle' || selectedType === 'pumped') && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Объём (мл)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="например: 120"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Время начала</label>
            <input
              type="time"
              value={manualStartTime}
              onChange={(e) => setManualStartTime(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <Button fullWidth size="lg" onClick={handleStart}>Начать таймер</Button>
        </div>
      </Drawer>

      {/* Drawer: стоп */}
      <Drawer open={stopDrawerOpen} onClose={() => setStopDrawerOpen(false)} title="Завершить кормление">
        <div className="space-y-4 pb-2">
          {activeFeeding && (activeFeeding.type === 'bottle' || activeFeeding.type === 'pumped') && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Объём (мл)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="например: 120"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Заметки</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Дополнительная информация..." rows={3}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
          </div>
          <Button fullWidth size="lg" onClick={handleStop}>Сохранить</Button>
        </div>
      </Drawer>

      {/* Drawer: вручную */}
      <Drawer open={manualDrawerOpen} onClose={() => setManualDrawerOpen(false)} title="Добавить вручную">
        <div className="space-y-4 pb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Тип кормления</p>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => (
                <button key={t.value} onClick={() => setSelectedType(t.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    selectedType === t.value ? 'border-pink-400 bg-pink-50 dark:bg-pink-950' : 'border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${t.iconBg} flex items-center justify-center`}>
                    <t.Icon size={16} className={t.iconColor} />
                  </div>
                  <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          {selectedType === 'breast' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Сторона</p>
              <div className="flex gap-2">
                {SIDES.map((s) => (
                  <button key={s.value} onClick={() => setSelectedSide(s.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                      selectedSide === s.value ? 'border-pink-400 bg-pink-50 dark:bg-pink-950 text-pink-600' : 'border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>
          )}
          {(selectedType === 'bottle' || selectedType === 'pumped') && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Объём (мл)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="например: 120"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Начало</label>
              <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Конец</label>
              <input type="time" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Заметки</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Дополнительная информация..." rows={2}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
          </div>
          <Button fullWidth size="lg" variant="secondary" onClick={handleManualAdd}>Добавить запись</Button>
        </div>
      </Drawer>
    </>
  )
}
