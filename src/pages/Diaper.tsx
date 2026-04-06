import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, Trash2, Droplets, AlertCircle, CheckCircle2, Layers } from 'lucide-react'
import { useDiaperStore } from '../store/diaperStore'
import { Card } from '../components/common/Card'
import { formatTimeAgo, formatTime } from '../utils/formatTime'
import { pageVariants, listVariants, itemVariants } from '../utils/animations'
import type { DiaperType } from '../types'

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
  const { addRecord, deleteRecord, getToday } = useDiaperStore()

  const todayRecords = getToday()
  const wetCount = todayRecords.filter((r) => r.type === 'wet' || r.type === 'mixed').length
  const dirtyCount = todayRecords.filter((r) => r.type === 'dirty' || r.type === 'mixed').length

  function handleAdd(type: DiaperType) {
    addRecord(type)
    const label = TYPES.find((t) => t.value === type)!.label
    toast.success(`Смена записана · ${label}`)
  }

  function handleDelete(id: string) {
    deleteRecord(id)
    toast.error('Запись удалена')
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
          <h1 className="text-xl font-bold text-gray-800">Подгузники</h1>
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
        <p className="text-xs text-gray-500 font-medium mb-3">Сменить подгузник</p>
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
        {todayRecords[0] && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Последняя смена: {formatTimeAgo(todayRecords[0].time)}
          </p>
        )}
      </Card>

      {/* История */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Сегодня ({todayRecords.length})
      </p>
      {todayRecords.length === 0 ? (
        <p className="text-center text-gray-300 text-sm py-8">Нет записей</p>
      ) : (
        <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
          {todayRecords.map((r) => {
            const t = TYPES.find((x) => x.value === r.type)!
            return (
              <motion.div
                key={r.id}
                variants={itemVariants}
                className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-full ${t.bg} flex items-center justify-center shrink-0`}>
                  <t.Icon size={16} className={t.iconColor} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{t.label}</p>
                  <p className="text-xs text-gray-400">{formatTime(r.time)}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleDelete(r.id)}
                  className="text-gray-300 hover:text-red-400 p-1"
                >
                  <Trash2 size={15} />
                </motion.button>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
