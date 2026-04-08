import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, Droplets, AlertCircle, CheckCircle2, Layers } from 'lucide-react'
import { ActionButtons } from '../components/ui/ActionButtons'
import { useDiaperStore } from '../store/diaperStore'
import { Card } from '../components/common/Card'
import { Drawer } from '../components/common/Drawer'
import { formatTimeAgo, formatTime } from '../utils/formatTime'
import { pageVariants, listVariants, itemVariants } from '../utils/animations'
import type { DiaperRecord, DiaperType } from '../types'

function resolveToISO(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  if (date.getTime() > Date.now() + 60_000) {
    date.setDate(date.getDate() - 1)
  }
  return date.toISOString()
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function currentHHMM(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

type DiaperTypeDef = {
  value: DiaperType
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  color: string
  bg: string
  iconColor: string
  border: string
}

const TYPES: DiaperTypeDef[] = [
  {
    value: 'wet', label: 'Мокрый',
    Icon: Droplets, iconColor: 'text-blue-500',
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
  },
  {
    value: 'dirty', label: 'Грязный',
    Icon: AlertCircle, iconColor: 'text-yellow-600',
    color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200',
  },
  {
    value: 'mixed', label: 'Смешанный',
    Icon: Layers, iconColor: 'text-orange-500',
    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200',
  },
  {
    value: 'dry', label: 'Сухой',
    Icon: CheckCircle2, iconColor: 'text-green-500',
    color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200',
  },
]

export function Diaper() {
  const navigate = useNavigate()
  const { addRecord, updateRecord, deleteRecord, getToday } = useDiaperStore()

  const [manualTime, setManualTime] = useState(currentHHMM)
  const [newComment, setNewComment] = useState('')

  // Состояние редактирования
  const [editRecord, setEditRecord] = useState<DiaperRecord | null>(null)
  const [editType, setEditType] = useState<DiaperType>('wet')
  const [editTime, setEditTime] = useState('')
  const [editComment, setEditComment] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setManualTime(currentHHMM())
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const todayRecords = getToday()
  const wetCount = todayRecords.filter((r) => r.type === 'wet' || r.type === 'mixed').length
  const dirtyCount = todayRecords.filter((r) => r.type === 'dirty' || r.type === 'mixed').length

  function handleAdd(type: DiaperType) {
    addRecord(type, newComment.trim() || undefined, resolveToISO(manualTime))
    const label = TYPES.find((t) => t.value === type)!.label
    toast.success(`Смена записана · ${label} · ${manualTime}`)
    setNewComment('')
  }

  function handleDelete(id: string) {
    deleteRecord(id)
    toast.error('Запись удалена')
  }

  function openEdit(r: DiaperRecord) {
    setEditRecord(r)
    setEditType(r.type)
    setEditTime(isoToHHMM(r.time))
    setEditComment(r.notes ?? '')
  }

  function handleSaveEdit() {
    if (!editRecord) return
    updateRecord(editRecord.id, {
      type: editType,
      time: resolveToISO(editTime),
      notes: editComment.trim() || undefined,
    })
    toast.success('Запись обновлена')
    setEditRecord(null)
  }

  return (
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
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Droplets size={16} className="text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Подгузники</h1>
        </div>
      </div>

      {/* Статистика */}
      <motion.div variants={listVariants} initial="initial" animate="animate" className="flex gap-3 mb-4">
        <motion.div variants={itemVariants} className="flex-1 bg-blue-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{wetCount}</p>
          <p className="text-xs text-blue-400">мокрых</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex-1 bg-yellow-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{dirtyCount}</p>
          <p className="text-xs text-yellow-400">грязных</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex-1 bg-gray-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-600">{todayRecords.length}</p>
          <p className="text-xs text-gray-400">всего</p>
        </motion.div>
      </motion.div>

      {/* Быстрые кнопки */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Сменить подгузник</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">Время:</span>
            <input
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        <motion.div
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-2"
        >
          {TYPES.map((t) => (
            <motion.button
              key={t.value}
              variants={itemVariants}
              onClick={() => handleAdd(t.value)}
              whileTap={{ scale: 0.93 }}
              className={`${t.bg} ${t.color} ${t.border} border-2 rounded-2xl p-4 text-left`}
            >
              <div className="mb-1">
                <t.Icon size={22} className={t.iconColor} />
              </div>
              <div className="text-sm font-semibold">{t.label}</div>
            </motion.button>
          ))}
        </motion.div>

        {/* Комментарий к новой записи */}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Комментарий (необязательно)"
          rows={2}
          className="w-full mt-3 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />

        {todayRecords[0] && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Последняя смена: {formatTimeAgo(todayRecords[0].time)}
          </p>
        )}
      </Card>

      {/* История */}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
        Сегодня ({todayRecords.length})
      </p>
      {todayRecords.length === 0 ? (
        <p className="text-center text-gray-300 dark:text-gray-600 text-sm py-8">Нет записей</p>
      ) : (
        <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
          {todayRecords.map((r) => {
            const t = TYPES.find((x) => x.value === r.type)!
            return (
              <motion.div
                key={r.id}
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-start gap-3"
              >
                <div className={`w-9 h-9 rounded-full ${t.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <t.Icon size={16} className={t.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatTime(r.time)}</p>
                  {r.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{r.notes}</p>
                  )}
                </div>
                <ActionButtons
                  onEdit={() => openEdit(r)}
                  onDelete={() => handleDelete(r.id)}
                  editColor="hover:text-blue-400"
                />
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Drawer редактирования */}
      <Drawer open={!!editRecord} onClose={() => setEditRecord(null)} title="Редактировать запись">
        <div className="space-y-4 pb-2">
          {/* Тип */}
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setEditType(t.value)}
                className={`${t.bg} ${t.border} border-2 rounded-2xl p-3 text-left transition-opacity ${editType === t.value ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className="mb-1"><t.Icon size={18} className={t.iconColor} /></div>
                <div className={`text-sm font-semibold ${t.color}`}>{t.label}</div>
              </button>
            ))}
          </div>

          {/* Время */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-16">Время</span>
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Комментарий */}
          <textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Комментарий"
            rows={3}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />

          <button
            onClick={handleSaveEdit}
            className="w-full bg-blue-500 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Сохранить
          </button>
        </div>
      </Drawer>
    </motion.div>
  )
}
