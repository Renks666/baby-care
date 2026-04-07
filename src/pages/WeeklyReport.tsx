import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, differenceInMinutes } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Milk, BedDouble, Droplets, TrendingUp, Award } from 'lucide-react'
import { useFeedingStore } from '../store/feedingStore'
import { useSleepStore } from '../store/sleepStore'
import { useDiaperStore } from '../store/diaperStore'
import { useGrowthStore } from '../store/growthStore'
import { useChildStore } from '../store/childStore'
import { pageVariants } from '../utils/animations'

function formatMins(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

function shortDay(date: Date): string {
  return format(date, 'EEE', { locale: ru }).slice(0, 2)
}

export function WeeklyReport() {
  const [weekOffset, setWeekOffset] = useState(0)

  const { records: feedRecords } = useFeedingStore()
  const { records: sleepRecords } = useSleepStore()
  const { records: diaperRecords } = useDiaperStore()
  const { records: growthRecords } = useGrowthStore()
  const { child } = useChildStore()

  const baseDate = new Date()
  const weekStart = startOfWeek(addWeeks(baseDate, weekOffset), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const prevWeekStart = startOfWeek(subWeeks(weekStart, 1), { weekStartsOn: 1 })
  const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: 1 })

  function isInRange(isoDate: string, start: Date, end: Date) {
    const d = new Date(isoDate)
    return d >= start && d <= end
  }

  // Текущая неделя
  const weekFeedings = feedRecords.filter((r) => isInRange(r.startTime, weekStart, weekEnd))
  const weekSleep = sleepRecords.filter((r) => r.endTime && isInRange(r.startTime, weekStart, weekEnd))
  const weekDiapers = diaperRecords.filter((r) => isInRange(r.time, weekStart, weekEnd))

  const totalSleepMin = weekSleep.reduce((acc, r) =>
    acc + differenceInMinutes(new Date(r.endTime!), new Date(r.startTime)), 0)
  const avgSleepMin = days.length > 0 ? Math.round(totalSleepMin / 7) : 0

  // Лучший день по сну
  const sleepByDay = days.map((day) => {
    const dayStr = day.toDateString()
    const dayMin = weekSleep
      .filter((r) => new Date(r.startTime).toDateString() === dayStr)
      .reduce((acc, r) => acc + differenceInMinutes(new Date(r.endTime!), new Date(r.startTime)), 0)
    return { day, dayMin }
  })
  const bestSleepDay = sleepByDay.reduce((best, cur) => cur.dayMin > best.dayMin ? cur : best, sleepByDay[0])

  // Прошлая неделя
  const prevFeedings = feedRecords.filter((r) => isInRange(r.startTime, prevWeekStart, prevWeekEnd))
  const prevSleep = sleepRecords.filter((r) => r.endTime && isInRange(r.startTime, prevWeekStart, prevWeekEnd))
  const prevDiapers = diaperRecords.filter((r) => isInRange(r.time, prevWeekStart, prevWeekEnd))
  const prevSleepMin = prevSleep.reduce((acc, r) =>
    acc + differenceInMinutes(new Date(r.endTime!), new Date(r.startTime)), 0)
  const prevAvgSleepMin = Math.round(prevSleepMin / 7)

  function delta(cur: number, prev: number) {
    const d = cur - prev
    if (d === 0) return null
    return { val: d, positive: d > 0 }
  }

  const feedDelta = delta(weekFeedings.length, prevFeedings.length)
  const sleepDelta = delta(avgSleepMin, prevAvgSleepMin)
  const diaperDelta = delta(weekDiapers.length, prevDiapers.length)

  // Рост за неделю
  const weekGrowth = growthRecords.filter((r) => isInRange(r.date, weekStart, weekEnd))
  const prevGrowth = growthRecords.filter((r) => isInRange(r.date, prevWeekStart, prevWeekEnd))
  const weightGain = (() => {
    if (weekGrowth.length === 0 || prevGrowth.length === 0) return null
    const curW = weekGrowth.find((r) => r.weight)?.weight
    const prevW = prevGrowth.find((r) => r.weight)?.weight
    if (!curW || !prevW) return null
    return curW - prevW
  })()

  // Данные для графика сна по дням
  const sleepChartData = days.map((day) => {
    const dayStr = day.toDateString()
    const dayMin = weekSleep
      .filter((r) => new Date(r.startTime).toDateString() === dayStr)
      .reduce((acc, r) => acc + differenceInMinutes(new Date(r.endTime!), new Date(r.startTime)), 0)
    return { day: shortDay(day), min: dayMin, h: +(dayMin / 60).toFixed(1) }
  })

  // Распределение кормлений по типам
  const feedTypes = { breast: 0, bottle: 0, pumped: 0, solid: 0 }
  weekFeedings.forEach((r) => { feedTypes[r.type as keyof typeof feedTypes]++ })
  const feedTotal = weekFeedings.length || 1

  const isCurrentWeek = weekOffset === 0
  const weekLabel = isCurrentWeek
    ? 'Эта неделя'
    : `${format(weekStart, 'd MMM', { locale: ru })} – ${format(weekEnd, 'd MMM', { locale: ru })}`

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Недельный отчёт</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{child.name}</p>

        {/* Навигация по неделям */}
        <div className="flex items-center justify-between mt-4 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-pink-100 dark:border-gray-700">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1 text-gray-400 hover:text-pink-500 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{weekLabel}</p>
            <p className="text-xs text-gray-400">
              {format(weekStart, 'd MMM', { locale: ru })} – {format(weekEnd, 'd MMM', { locale: ru })}
            </p>
          </div>
          <button
            onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
            disabled={isCurrentWeek}
            className="p-1 text-gray-400 hover:text-pink-500 disabled:opacity-30 active:scale-90 transition-transform"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Главные цифры */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Milk size={18} className="text-pink-500" />}
            label="Кормлений"
            value={String(weekFeedings.length)}
            delta={feedDelta}
            bg="bg-pink-50 dark:bg-pink-950/40"
            border="border-pink-100 dark:border-pink-900/40"
          />
          <StatCard
            icon={<BedDouble size={18} className="text-purple-500" />}
            label="Сон / день"
            value={formatMins(avgSleepMin)}
            delta={sleepDelta ? { val: sleepDelta.val, positive: sleepDelta.positive, unit: ' мин' } : null}
            bg="bg-purple-50 dark:bg-purple-950/40"
            border="border-purple-100 dark:border-purple-900/40"
          />
          <StatCard
            icon={<Droplets size={18} className="text-blue-500" />}
            label="Подгузников"
            value={String(weekDiapers.length)}
            delta={diaperDelta}
            bg="bg-blue-50 dark:bg-blue-950/40"
            border="border-blue-100 dark:border-blue-900/40"
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-emerald-500" />}
            label="Набрала вес"
            value={weightGain !== null ? `${weightGain > 0 ? '+' : ''}${weightGain} г` : '—'}
            delta={null}
            bg="bg-emerald-50 dark:bg-emerald-950/40"
            border="border-emerald-100 dark:border-emerald-900/40"
          />
        </div>

        {/* Лучший день по сну */}
        {bestSleepDay && bestSleepDay.dayMin > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-pink-100 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Award size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">Лучший день по сну</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">
                {format(bestSleepDay.day, 'EEEE, d MMMM', { locale: ru })} · {formatMins(bestSleepDay.dayMin)}
              </p>
            </div>
          </div>
        )}

        {/* График сна по дням */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-pink-100 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Сон по дням (часы)</p>
          {totalSleepMin === 0 ? (
            <p className="text-center text-gray-300 dark:text-gray-600 text-sm py-6">Нет данных за эту неделю</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={sleepChartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-purple-100 dark:border-gray-700 rounded-xl px-3 py-2 text-xs shadow-md">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{payload[0].payload.day}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">{formatMins(Number(payload[0].payload.min))}</span>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="h" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={32} animationBegin={0} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Распределение кормлений */}
        {weekFeedings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-pink-100 dark:border-gray-700 p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Кормления по типам</p>
            <div className="space-y-2">
              {([
                { key: 'breast', label: 'Грудь', color: 'bg-pink-400' },
                { key: 'bottle', label: 'Смесь', color: 'bg-blue-400' },
                { key: 'pumped', label: 'Сцеженное', color: 'bg-purple-400' },
                { key: 'solid', label: 'Прикорм', color: 'bg-orange-400' },
              ] as const).map(({ key, label, color }) => {
                const count = feedTypes[key]
                if (count === 0) return null
                const pct = Math.round((count / feedTotal) * 100)
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-10 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function StatCard({
  icon, label, value, delta, bg, border,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta: { val: number; positive: boolean; unit?: string } | null
  bg: string
  border: string
}) {
  return (
    <div className={`${bg} border ${border} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      {delta && (
        <p className={`text-xs mt-1 font-medium ${delta.positive ? 'text-green-500' : 'text-red-400'}`}>
          {delta.positive ? '+' : ''}{delta.val}{delta.unit ?? ''} vs прошлой
        </p>
      )}
    </div>
  )
}
