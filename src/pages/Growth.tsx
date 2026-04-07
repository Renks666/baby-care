import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, Trash2, Ruler } from 'lucide-react'
import { useGrowthStore } from '../store/growthStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Drawer } from '../components/common/Drawer'
import { formatDate } from '../utils/formatTime'
import { pageVariants, listVariants, itemVariants } from '../utils/animations'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

export function Growth() {
  const navigate = useNavigate()
  const { records, addRecord, deleteRecord, getLatest } = useGrowthStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [headCirc, setHeadCirc] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [activeTab, setActiveTab] = useState<'weight' | 'height' | 'head'>('weight')

  const latest = getLatest()

  function handleAdd() {
    if (!weight && !height && !headCirc) return
    addRecord({
      date: new Date(date).toISOString(),
      weight: weight ? parseFloat(weight) * 1000 : undefined,
      height: height ? parseFloat(height) : undefined,
      headCirc: headCirc ? parseFloat(headCirc) : undefined,
    })
    setWeight('')
    setHeight('')
    setHeadCirc('')
    setDate(new Date().toISOString().slice(0, 10))
    setDrawerOpen(false)
    toast.success('Замер сохранён')
  }

  function handleDelete(id: string) {
    deleteRecord(id)
    toast.error('Запись удалена')
  }

  const chartData = [...records]
    .reverse()
    .slice(-10)
    .map((r) => ({
      date: formatDate(r.date),
      weight: r.weight ? +(r.weight / 1000).toFixed(2) : undefined,
      height: r.height,
      headCirc: r.headCirc,
    }))

  const TAB_KEYS = { weight: 'weight', height: 'height', head: 'headCirc' } as const
  const TAB_LABELS = { weight: 'Вес (кг)', height: 'Рост (см)', head: 'Голова (см)' }
  const TAB_COLORS = { weight: '#f43f75', height: '#8b5cf6', head: '#3b82f6' }

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
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Ruler size={16} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Рост и вес</h1>
          </div>
        </div>

        {/* Последние показатели */}
        {latest && (
          <motion.div variants={listVariants} initial="initial" animate="animate" className="flex gap-3 mb-4">
            {latest.weight && (
              <motion.div variants={itemVariants} className="flex-1 bg-pink-50 rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-pink-600">{(latest.weight / 1000).toFixed(2)} кг</p>
                <p className="text-xs text-pink-400">вес</p>
              </motion.div>
            )}
            {latest.height && (
              <motion.div variants={itemVariants} className="flex-1 bg-purple-50 rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{latest.height} см</p>
                <p className="text-xs text-purple-400">рост</p>
              </motion.div>
            )}
            {latest.headCirc && (
              <motion.div variants={itemVariants} className="flex-1 bg-blue-50 rounded-2xl p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{latest.headCirc} см</p>
                <p className="text-xs text-blue-400">голова</p>
              </motion.div>
            )}
          </motion.div>
        )}

        <Button fullWidth onClick={() => setDrawerOpen(true)} className="mb-4">
          + Добавить замер
        </Button>

        {/* График */}
        {chartData.length > 1 && (
          <Card className="mb-4">
            <div className="flex gap-2 mb-4">
              {(['weight', 'height', 'head'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === tab ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {tab === 'weight' ? 'Вес' : tab === 'height' ? 'Рост' : 'Голова'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-2">{TAB_LABELS[activeTab]}</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={TAB_KEYS[activeTab]}
                  stroke={TAB_COLORS[activeTab]}
                  strokeWidth={2.5}
                  dot={{ fill: TAB_COLORS[activeTab], r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* История */}
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          История ({records.length})
        </p>
        {records.length === 0 ? (
          <p className="text-center text-gray-300 dark:text-gray-600 text-sm py-8">Нет записей</p>
        ) : (
          <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
            {records.map((r) => (
              <motion.div
                key={r.id}
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Ruler size={16} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {r.weight ? `${(r.weight / 1000).toFixed(2)} кг` : ''}
                    {r.weight && r.height ? ' · ' : ''}
                    {r.height ? `${r.height} см` : ''}
                    {(r.weight || r.height) && r.headCirc ? ' · ' : ''}
                    {r.headCirc ? `○ ${r.headCirc} см` : ''}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(r.date)}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleDelete(r.id)}
                  className="text-gray-300 hover:text-red-400 p-1"
                >
                  <Trash2 size={15} />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Drawer: добавить замер */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Новый замер">
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Дата замера</label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Вес (кг)</label>
            <input
              type="number"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="например: 3.85"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Рост (см)</label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="например: 52.5"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium block mb-1">Окружность головы (см)</label>
            <input
              type="number"
              step="0.1"
              value={headCirc}
              onChange={(e) => setHeadCirc(e.target.value)}
              placeholder="например: 35"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={handleAdd}
            disabled={!weight && !height && !headCirc}
          >
            Сохранить
          </Button>
        </div>
      </Drawer>
    </>
  )
}
