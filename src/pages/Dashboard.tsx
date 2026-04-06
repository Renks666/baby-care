import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Milk, BedDouble, Droplets, Ruler, Sparkles } from 'lucide-react'
import { useChildStore } from '../store/childStore'
import { useFeedingStore } from '../store/feedingStore'
import { useSleepStore } from '../store/sleepStore'
import { useDiaperStore } from '../store/diaperStore'
import { useGrowthStore } from '../store/growthStore'
import { Card } from '../components/common/Card'
import { Timer } from '../components/common/Timer'
import {
  formatAge, formatTimeAgo, formatDuration, getHoursSince,
} from '../utils/formatTime'
import {
  pageVariants, listVariants, itemVariants,
} from '../utils/animations'

const FEEDING_LABELS: Record<string, string> = {
  breast: 'Грудь',
  bottle: 'Смесь',
  pumped: 'Сцеженное',
  solid: 'Прикорм',
}

const SIDE_LABELS: Record<string, string> = {
  left: '← Лев.',
  right: 'Прав. →',
  both: '← →',
}

export function Dashboard() {
  const navigate = useNavigate()
  const { child } = useChildStore()
  const { records: feedRecords, activeFeeding } = useFeedingStore()
  const { records: sleepRecords, activeSleep } = useSleepStore()
  const { getToday: getDiaperToday } = useDiaperStore()
  const { getLatest } = useGrowthStore()

  const todayFeedings = feedRecords.filter(
    (r) => new Date(r.startTime).toDateString() === new Date().toDateString()
  )
  const todaySleep = sleepRecords.filter(
    (r) => new Date(r.startTime).toDateString() === new Date().toDateString()
  )
  const todayDiapers = getDiaperToday()
  const latestGrowth = getLatest()
  const lastFeeding = activeFeeding ?? feedRecords[0]

  const totalSleepMin = todaySleep.reduce((acc, r) => {
    if (!r.endTime) return acc
    return acc + Math.floor(
      (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000
    )
  }, 0)

  const hoursSinceLastFeed = lastFeeding
    ? getHoursSince(lastFeeding.endTime ?? lastFeeding.startTime)
    : null

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="px-4 pb-24"
    >
      {/* Шапка */}
      <div className="pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Сегодня</p>
            <h1 className="text-2xl font-bold text-gray-800">Привет!</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/profile')}
            className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-lg"
          >
            {child.name.charAt(0)}
          </motion.button>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 inline-flex items-center gap-2 bg-pink-50 rounded-full px-4 py-2"
        >
          <Sparkles size={14} className="text-pink-400" />
          <span className="text-sm font-medium text-pink-600">
            {child.name} · {formatAge(child.birthDate)}
          </span>
        </motion.div>
      </div>

      {/* Активные таймеры */}
      {(activeFeeding || activeSleep) && (
        <div className="mb-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Активно сейчас</p>

          {activeFeeding && (
            <Card className="border-pink-200 bg-pink-50" onClick={() => navigate('/feeding')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Milk size={20} className="text-pink-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      {FEEDING_LABELS[activeFeeding.type]}
                      {activeFeeding.side ? ` · ${SIDE_LABELS[activeFeeding.side]}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">кормление идёт</p>
                  </div>
                </div>
                <Timer startTime={activeFeeding.startTime} className="text-pink-500 font-bold text-lg" showPulse />
              </div>
            </Card>
          )}

          {activeSleep && (
            <Card className="border-purple-200 bg-purple-50" onClick={() => navigate('/sleep')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <BedDouble size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      {activeSleep.type === 'night' ? 'Ночной сон' : 'Дневной сон'}
                    </p>
                    <p className="text-xs text-gray-400">спит</p>
                  </div>
                </div>
                <Timer startTime={activeSleep.startTime} className="text-purple-500 font-bold text-lg" showPulse />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Сводка дня */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">За сегодня</p>
      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<Milk size={22} />}
            label="Кормлений" value={String(todayFeedings.length)}
            sub={hoursSinceLastFeed !== null ? (hoursSinceLastFeed < 1 ? 'только что' : `${hoursSinceLastFeed} ч назад`) : 'не было'}
            color="pink" onClick={() => navigate('/feeding')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<BedDouble size={22} />}
            label="Сон" value={totalSleepMin > 0 ? formatMins(totalSleepMin) : '—'}
            sub={`${todaySleep.length} раз`}
            color="purple" onClick={() => navigate('/sleep')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<Droplets size={22} />}
            label="Подгузников" value={String(todayDiapers.length)}
            sub={todayDiapers[0] ? formatTimeAgo(todayDiapers[0].time) : 'не было'}
            color="blue" onClick={() => navigate('/diaper')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<Ruler size={22} />}
            label="Вес"
            value={latestGrowth?.weight ? `${(latestGrowth.weight / 1000).toFixed(2)} кг` : '—'}
            sub={latestGrowth?.height ? `${latestGrowth.height} см` : 'нет данных'}
            color="green" onClick={() => navigate('/growth')}
          />
        </motion.div>
      </motion.div>

      {/* Быстрые действия */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Быстро добавить</p>
      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3"
      >
        {[
          { icon: <Milk size={22} className="text-pink-500" />, label: 'Кормление', path: '/feeding' },
          { icon: <BedDouble size={22} className="text-purple-500" />, label: 'Сон', path: '/sleep' },
          { icon: <Droplets size={22} className="text-blue-500" />, label: 'Подгузник', path: '/diaper' },
          { icon: <Ruler size={22} className="text-emerald-500" />, label: 'Рост / Вес', path: '/growth' },
        ].map((item) => (
          <motion.div key={item.path} variants={itemVariants}>
            <QuickButton icon={item.icon} label={item.label} onClick={() => navigate(item.path)} />
          </motion.div>
        ))}
      </motion.div>

      {/* Последние события */}
      {feedRecords.length + sleepRecords.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Последние записи</p>
            <button onClick={() => navigate('/timeline')} className="text-xs text-pink-500 font-medium">
              Все →
            </button>
          </div>
          <motion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {([] as Array<typeof feedRecords[0] | typeof sleepRecords[0]>)
              .concat(feedRecords.slice(0, 2), sleepRecords.slice(0, 1))
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
              .slice(0, 3)
              .map((record) => {
                if (record.type === 'breast' || record.type === 'bottle' || record.type === 'pumped' || record.type === 'solid') {
                  return (
                    <motion.div key={record.id} variants={itemVariants}>
                      <RecentItem
                        icon={<Milk size={18} className="text-pink-400" />}
                        title={FEEDING_LABELS[record.type]}
                        sub={record.endTime ? formatDuration(record.startTime, record.endTime) : 'незавершено'}
                        time={formatTimeAgo(record.startTime)}
                      />
                    </motion.div>
                  )
                }
                return (
                  <motion.div key={record.id} variants={itemVariants}>
                    <RecentItem
                      icon={<BedDouble size={18} className="text-purple-400" />}
                      title={record.type === 'night' ? 'Ночной сон' : 'Дневной сон'}
                      sub={record.endTime ? formatDuration(record.startTime, record.endTime) : 'незавершено'}
                      time={formatTimeAgo(record.startTime)}
                    />
                  </motion.div>
                )
              })}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// ── Вспомогательные компоненты ──────────────────────────

function SummaryCard({
  icon, label, value, sub, color, onClick,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string
  color: 'pink' | 'purple' | 'blue' | 'green'; onClick: () => void
}) {
  const colors = {
    pink: 'bg-pink-50 text-pink-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`${colors[color]} rounded-2xl p-4 text-left w-full`}
    >
      <div className="mb-2 opacity-80">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-70 mt-0.5">{label}</div>
      <div className="text-xs opacity-50 mt-1">{sub}</div>
    </motion.button>
  )
}

function QuickButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="bg-white border border-pink-100 rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm w-full"
    >
      {icon}
      <span className="font-medium text-gray-700 text-sm">{label}</span>
    </motion.button>
  )
}

function RecentItem({ icon, title, sub, time }: { icon: React.ReactNode; title: string; sub: string; time: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-pink-50">
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{time}</span>
    </div>
  )
}

function formatMins(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}м`
  if (m === 0) return `${h}ч`
  return `${h}ч ${m}м`
}
