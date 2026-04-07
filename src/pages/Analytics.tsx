import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Droplets, Moon, Baby, CalendarRange } from 'lucide-react'
import { useFeedingStore } from '../store/feedingStore'
import { useSleepStore } from '../store/sleepStore'
import { useDiaperStore } from '../store/diaperStore'
import { Card } from '../components/common/Card'
import { pageVariants } from '../utils/animations'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

type Period = 7 | 14 | 30
type Tab = 'feeding' | 'sleep' | 'diaper'

function getDaysRange(days: number): string[] {
  const result: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    result.push(d.toISOString().slice(0, 10))
  }
  return result
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

function minutesToHours(min: number): number {
  return Math.round((min / 60) * 10) / 10
}

// ── Custom tooltip ───────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  const nonZero = payload.filter((p) => (p.value ?? 0) > 0)
  if (!nonZero.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-pink-100 dark:border-gray-700 rounded-2xl px-3 py-2.5 shadow-xl min-w-[110px]">
      <p className="text-[11px] font-semibold text-gray-400 mb-1.5">{label}</p>
      {nonZero.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs py-0.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.fill ?? entry.color }} />
          <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
          <span className="font-bold text-gray-800 dark:text-gray-100 ml-auto pl-2">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────
function EmptyChart({ Icon, label }: { Icon: React.ElementType; label: string }) {
  return (
    <div className="h-[180px] flex flex-col items-center justify-center gap-2 text-gray-200 dark:text-gray-700">
      <Icon size={36} strokeWidth={1.2} />
      <p className="text-xs text-gray-300 dark:text-gray-600">{label}</p>
    </div>
  )
}

const AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 10, fill: '#9ca3af' },
} as const

const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: '#f3f4f6',
  vertical: false,
} as const

const PERIOD_OPTIONS: Period[] = [7, 14, 30]

export function Analytics() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>(7)
  const [tab, setTab] = useState<Tab>('feeding')

  const { records: feedingRecords } = useFeedingStore()
  const { records: sleepRecords } = useSleepStore()
  const { records: diaperRecords } = useDiaperStore()

  const days = useMemo(() => getDaysRange(period), [period])
  const xInterval = period === 7 ? 0 : period === 14 ? 1 : 4

  // ── КОРМЛЕНИЕ ───────────────────────────────────────────
  const feedingData = useMemo(() => days.map((day) => {
    const recs = feedingRecords.filter((r) => r.startTime.slice(0, 10) === day)
    return {
      date: shortDate(day),
      breast: recs.filter((r) => r.type === 'breast').length,
      bottle: recs.filter((r) => r.type === 'bottle').length,
      pumped: recs.filter((r) => r.type === 'pumped').length,
      solid: recs.filter((r) => r.type === 'solid').length,
      total: recs.length,
    }
  }), [feedingRecords, days])

  const feedingStats = useMemo(() => {
    const filtered = feedingRecords.filter((r) => r.startTime.slice(0, 10) >= days[0])
    return {
      total: filtered.length,
      avgPerDay: days.length ? Math.round((filtered.length / days.length) * 10) / 10 : 0,
      byType: {
        breast: filtered.filter((r) => r.type === 'breast').length,
        bottle: filtered.filter((r) => r.type === 'bottle').length,
        pumped: filtered.filter((r) => r.type === 'pumped').length,
        solid: filtered.filter((r) => r.type === 'solid').length,
      },
    }
  }, [feedingRecords, days])

  const feedingEmpty = feedingData.every((d) => d.total === 0)

  // ── СОН ─────────────────────────────────────────────────
  const sleepData = useMemo(() => days.map((day) => {
    const recs = sleepRecords.filter((r) => r.startTime.slice(0, 10) === day && r.endTime)
    const calc = (type: string) => recs
      .filter((r) => r.type === type)
      .reduce((acc, r) => acc + (new Date(r.endTime!).getTime() - new Date(r.startTime).getTime()) / 60000, 0)
    return { date: shortDate(day), nap: minutesToHours(calc('nap')), night: minutesToHours(calc('night')) }
  }), [sleepRecords, days])

  const sleepStats = useMemo(() => {
    const filtered = sleepRecords.filter((r) => r.startTime.slice(0, 10) >= days[0] && r.endTime)
    const totalMin = filtered.reduce(
      (acc, r) => acc + (new Date(r.endTime!).getTime() - new Date(r.startTime).getTime()) / 60000, 0
    )
    const qualityRecs = filtered.filter((r) => r.quality)
    return {
      totalHours: minutesToHours(totalMin),
      avgPerDay: days.length ? minutesToHours(totalMin / days.length) : 0,
      avgQuality: qualityRecs.length
        ? Math.round((qualityRecs.reduce((a, r) => a + r.quality!, 0) / qualityRecs.length) * 10) / 10
        : null,
    }
  }, [sleepRecords, days])

  const sleepEmpty = sleepData.every((d) => d.nap === 0 && d.night === 0)

  // ── ПОДГУЗНИКИ ──────────────────────────────────────────
  const diaperData = useMemo(() => days.map((day) => {
    const recs = diaperRecords.filter((r) => r.time.slice(0, 10) === day)
    return {
      date: shortDate(day),
      wet: recs.filter((r) => r.type === 'wet').length,
      dirty: recs.filter((r) => r.type === 'dirty').length,
      mixed: recs.filter((r) => r.type === 'mixed').length,
      dry: recs.filter((r) => r.type === 'dry').length,
      total: recs.length,
    }
  }), [diaperRecords, days])

  const diaperStats = useMemo(() => {
    const filtered = diaperRecords.filter((r) => r.time.slice(0, 10) >= days[0])
    return {
      total: filtered.length,
      avgPerDay: days.length ? Math.round((filtered.length / days.length) * 10) / 10 : 0,
      wet: filtered.filter((r) => r.type === 'wet').length,
      dirty: filtered.filter((r) => r.type === 'dirty').length,
      mixed: filtered.filter((r) => r.type === 'mixed').length,
      dry: filtered.filter((r) => r.type === 'dry').length,
    }
  }, [diaperRecords, days])

  const diaperEmpty = diaperData.every((d) => d.total === 0)

  const tabs = [
    { key: 'feeding' as Tab, label: 'Кормление', Icon: Baby,     activeBg: 'bg-pink-500' },
    { key: 'sleep'   as Tab, label: 'Сон',       Icon: Moon,     activeBg: 'bg-indigo-500' },
    { key: 'diaper'  as Tab, label: 'Подгузники', Icon: Droplets, activeBg: 'bg-sky-500' },
  ]

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="px-4 pb-24"
    >
      {/* Шапка */}
      <div className="pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
            <BarChart3 size={16} className="text-pink-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Графики</h1>
        </div>
        <button
          onClick={() => navigate('/weekly')}
          className="flex items-center gap-1.5 text-xs font-medium text-pink-500 bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 px-3 py-2 rounded-xl active:scale-95 transition-transform"
        >
          <CalendarRange size={13} />
          За неделю
        </button>
      </div>

      {/* Период */}
      <div className="flex gap-2 mb-5">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              period === p
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {p} дней
          </button>
        ))}
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-5">
        {tabs.map(({ key, label, Icon, activeBg }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-medium transition-colors ${
              tab === key
                ? `${activeBg} text-white shadow-sm`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── КОРМЛЕНИЕ ─────────────────────────────────────── */}
      {tab === 'feeding' && (
        <motion.div
          key="feeding"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-bold text-pink-500">{feedingStats.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">всего кормлений</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-pink-500">{feedingStats.avgPerDay}</p>
              <p className="text-xs text-gray-400 mt-0.5">в среднем / день</p>
            </Card>
          </div>

          {/* По типу — с цветными точками */}
          <Card>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">По типу</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Грудь',      value: feedingStats.byType.breast, dot: '#f43f75', bg: 'bg-pink-50 dark:bg-pink-950' },
                { label: 'Бутылочка', value: feedingStats.byType.bottle, dot: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950' },
                { label: 'Сцеженное', value: feedingStats.byType.pumped, dot: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950' },
                { label: 'Прикорм',   value: feedingStats.byType.solid,  dot: '#22c55e', bg: 'bg-green-50 dark:bg-green-950' },
              ].map(({ label, value, dot, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{value}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* График */}
          <Card>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Кормлений в день</p>
            {feedingEmpty ? (
              <EmptyChart Icon={Baby} label="Нет данных за этот период" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={feedingData} margin={{ top: 8, right: 5, bottom: 0, left: -20 }} barSize={period === 30 ? 6 : 14}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="date" {...AXIS_PROPS} interval={xInterval} />
                  <YAxis {...AXIS_PROPS} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244,63,117,0.06)', radius: 6 }} />
                  <Bar dataKey="breast" name="Грудь"      stackId="a" fill="#f43f75" animationDuration={700} animationBegin={0} />
                  <Bar dataKey="bottle" name="Бутылочка"  stackId="a" fill="#f59e0b" animationDuration={700} animationBegin={80} />
                  <Bar dataKey="pumped" name="Сцеженное"  stackId="a" fill="#3b82f6" animationDuration={700} animationBegin={160} />
                  <Bar dataKey="solid"  name="Прикорм"    stackId="a" fill="#22c55e" radius={[5, 5, 0, 0]} animationDuration={700} animationBegin={240} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      )}

      {/* ── СОН ───────────────────────────────────────────── */}
      {tab === 'sleep' && (
        <motion.div
          key="sleep"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-bold text-indigo-500">{sleepStats.avgPerDay}</p>
              <p className="text-xs text-gray-400 mt-0.5">ч / день</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-indigo-500">{sleepStats.totalHours}</p>
              <p className="text-xs text-gray-400 mt-0.5">ч всего</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-indigo-500">{sleepStats.avgQuality ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">качество</p>
            </Card>
          </div>

          {/* Легенда */}
          <div className="flex gap-4 px-1">
            {[
              { label: 'Дневной', dot: '#a78bfa' },
              { label: 'Ночной',  dot: '#4f46e5' },
            ].map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: dot }} />
                {label}
              </div>
            ))}
            {sleepStats.avgPerDay > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
                <div className="w-5 h-px border-t-2 border-dashed border-indigo-300" />
                среднее
              </div>
            )}
          </div>

          <Card>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Часов сна в день</p>
            {sleepEmpty ? (
              <EmptyChart Icon={Moon} label="Нет данных за этот период" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={sleepData} margin={{ top: 8, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="napGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="nightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="date" {...AXIS_PROPS} interval={xInterval} />
                  <YAxis {...AXIS_PROPS} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a78bfa', strokeWidth: 1, strokeDasharray: '4 3' }} />
                  <Area
                    type="monotone"
                    dataKey="night"
                    name="Ночной"
                    stackId="1"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#nightGrad)"
                    animationDuration={900}
                    animationBegin={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="nap"
                    name="Дневной"
                    stackId="1"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fill="url(#napGrad)"
                    animationDuration={900}
                    animationBegin={200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      )}

      {/* ── ПОДГУЗНИКИ ────────────────────────────────────── */}
      {tab === 'diaper' && (
        <motion.div
          key="diaper"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-bold text-sky-500">{diaperStats.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">всего замен</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-sky-500">{diaperStats.avgPerDay}</p>
              <p className="text-xs text-gray-400 mt-0.5">в среднем / день</p>
            </Card>
          </div>

          {/* По типу — с цветными точками */}
          <Card>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">По типу</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Мокрый',     value: diaperStats.wet,   dot: '#38bdf8', bg: 'bg-sky-50 dark:bg-sky-950' },
                { label: 'Грязный',    value: diaperStats.dirty, dot: '#d97706', bg: 'bg-amber-50 dark:bg-amber-950' },
                { label: 'Смешанный',  value: diaperStats.mixed, dot: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-950' },
                { label: 'Сухой',      value: diaperStats.dry,   dot: '#9ca3af', bg: 'bg-gray-50 dark:bg-gray-800' },
              ].map(({ label, value, dot, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{value}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Замен в день</p>
            {diaperEmpty ? (
              <EmptyChart Icon={Droplets} label="Нет данных за этот период" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={diaperData} margin={{ top: 8, right: 5, bottom: 0, left: -20 }} barSize={period === 30 ? 6 : 14}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="date" {...AXIS_PROPS} interval={xInterval} />
                  <YAxis {...AXIS_PROPS} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56,189,248,0.06)', radius: 6 }} />
                  <Bar dataKey="wet"   name="Мокрый"    stackId="a" fill="#38bdf8" animationDuration={700} animationBegin={0} />
                  <Bar dataKey="dirty" name="Грязный"   stackId="a" fill="#d97706" animationDuration={700} animationBegin={80} />
                  <Bar dataKey="mixed" name="Смешанный" stackId="a" fill="#a855f7" animationDuration={700} animationBegin={160} />
                  <Bar dataKey="dry"   name="Сухой"     stackId="a" fill="#9ca3af" radius={[5, 5, 0, 0]} animationDuration={700} animationBegin={240} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
