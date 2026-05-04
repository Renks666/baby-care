import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, Baby, Utensils, Pause, Play } from 'lucide-react'
import { ActionButtons } from '../components/ui/ActionButtons'
import { useFeedingStore } from '../store/feedingStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Timer } from '../components/common/Timer'
import { Drawer } from '../components/common/Drawer'
import { formatNetDuration, formatTime, resolveToISO, currentHHMM } from '../utils/formatTime'
import { pageVariants, listVariants, itemVariants } from '../utils/animations'
import type { FeedingType, FeedingRecord } from '../types'

type FeedingDef = {
  value: FeedingType
  label: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  iconBg: string
  iconColor: string
}

const TYPES: FeedingDef[] = [
  { value: 'bottle', label: 'Смесь', Icon: Baby, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
  { value: 'solid', label: 'Прикорм', Icon: Utensils, iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
]

const FALLBACK_DEF: FeedingDef = TYPES[0]

function FeedingIcon({ type, size = 18 }: { type: FeedingType; size?: number }) {
  const def = TYPES.find((t) => t.value === type) ?? FALLBACK_DEF
  return (
    <div className={`w-9 h-9 rounded-full ${def.iconBg} flex items-center justify-center shrink-0`}>
      <def.Icon size={size} className={def.iconColor} />
    </div>
  )
}


export function Feeding() {
  const navigate = useNavigate()
  const { records, activeFeeding, startFeeding, stopFeeding, pauseFeeding, resumeFeeding, addRecord, updateRecord, deleteRecord } = useFeedingStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stopDrawerOpen, setStopDrawerOpen] = useState(false)
  const [manualDrawerOpen, setManualDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<FeedingRecord | null>(null)

  const [selectedType, setSelectedType] = useState<FeedingType>('bottle')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [manualStartTime, setManualStartTime] = useState('')
  const [manualEndTime, setManualEndTime] = useState('')

  // Edit state
  const [editType, setEditType] = useState<FeedingType>('bottle')
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')

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
    startFeeding(selectedType, undefined, resolveToISO(manualStartTime))
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
      amount: amount ? parseFloat(amount) : undefined,
      notes: notes || undefined,
    })
    setAmount('')
    setNotes('')
    setManualDrawerOpen(false)
    toast.success('Запись добавлена')
  }

  function openEditDrawer(record: FeedingRecord) {
    setEditRecord(record)
    setEditType(record.type)
    setEditAmount(record.amount ? String(record.amount) : '')
    setEditNotes(record.notes ?? '')
    setEditDrawerOpen(true)
  }

  function handleEditSave() {
    if (!editRecord) return
    updateRecord(editRecord.id, {
      type: editType,
      amount: editAmount ? parseFloat(editAmount) : undefined,
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

  const totalMlToday = todayRecords
    .filter((r) => r.type === 'bottle')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const formulaCount = todayRecords.filter((r) => r.type === 'bottle').length

  const activeDef = activeFeeding ? (TYPES.find((t) => t.value === activeFeeding.type) ?? FALLBACK_DEF) : null

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
              <Baby size={16} className="text-pink-500" />
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
              <p className="text-sm text-pink-400 font-medium mb-2">
                {activeFeeding.pausedAt ? 'На паузе ⏸' : 'Кормление идёт'}
              </p>
              <Timer
                startTime={activeFeeding.startTime}
                pausedMs={activeFeeding.pausedMs}
                pausedAt={activeFeeding.pausedAt}
                className="text-5xl font-bold text-pink-500"
                showPulse
              />
              <p className="text-sm text-gray-500 mt-3">
                {activeDef.label}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={activeFeeding.pausedAt ? resumeFeeding : pauseFeeding}
              >
                {activeFeeding.pausedAt ? (
                  <span className="flex items-center justify-center gap-2"><Play size={18} />Продолжить</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Pause size={18} />Пауза</span>
                )}
              </Button>
              <Button fullWidth size="lg" onClick={() => setStopDrawerOpen(true)}>
                Завершить кормление
              </Button>
            </div>
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

        <Card className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">Смесь за сутки</p>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalMlToday > 0 ? `${totalMlToday} мл` : '—'}
              </p>
              <p className="text-xs text-blue-400 mt-0.5">итого объём</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formulaCount}</p>
              <p className="text-xs text-blue-400 mt-0.5">кормлений</p>
            </div>
          </div>
        </Card>

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
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(r.startTime)}
                      {r.endTime ? ` · ${formatNetDuration(r.startTime, r.endTime, r.pausedMs)}` : ''}
                      {r.amount ? ` · ${r.amount} мл` : ''}
                    </p>
                    {r.notes && r.type === 'solid' && (
                      <p className="text-xs text-orange-400 mt-0.5 truncate">{r.notes}</p>
                    )}
                  </div>
                  <ActionButtons onEdit={() => openEditDrawer(r)} onDelete={() => handleDelete(r.id)} />
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
            <div className="grid grid-cols-2 gap-2">
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
          {selectedType === 'bottle' && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Объём (мл)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="например: 120"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
          )}
          {selectedType === 'solid' && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Что ест (заметка)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="например: пюре из яблока"
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
          {activeFeeding && activeFeeding.type === 'bottle' && (
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
            <div className="grid grid-cols-2 gap-2">
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
          {selectedType === 'bottle' && (
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

      {/* Drawer: редактирование */}
      <Drawer open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} title="Редактировать запись">
        <div className="space-y-4 pb-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Тип кормления</p>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button key={t.value} onClick={() => setEditType(t.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    editType === t.value ? 'border-pink-400 bg-pink-50 dark:bg-pink-950' : 'border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
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
          {editType === 'bottle' && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Объём (мл)</label>
              <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="например: 120"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Заметки</label>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Дополнительная информация..." rows={2}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
          </div>
          <Button fullWidth size="lg" onClick={handleEditSave}>Сохранить</Button>
        </div>
      </Drawer>
    </>
  )
}
