import { motion } from 'framer-motion'
import { Clock, Milk, Moon, Sun, Droplets, AlertCircle, CheckCircle2, Layers, Ruler, Heart, PenLine, FlipVertical2 } from 'lucide-react'
import { useFeedingStore } from '../store/feedingStore'
import { useSleepStore } from '../store/sleepStore'
import { useDiaperStore } from '../store/diaperStore'
import { useGrowthStore } from '../store/growthStore'
import { useNotesStore } from '../store/notesStore'
import { useTummyStore } from '../store/tummyStore'
import { formatTime, formatDate, formatDuration } from '../utils/formatTime'
import { pageVariants, listVariants, itemSlideVariants } from '../utils/animations'

type EventItem = {
  id: string
  time: string
  icon: React.ReactNode
  title: string
  subtitle: string
  borderColor: string
}

const FEEDING_LABELS: Record<string, string> = {
  breast: 'Грудь', bottle: 'Смесь', pumped: 'Сцеженное', solid: 'Прикорм',
}

const DIAPER_LABELS: Record<string, string> = {
  wet: 'Мокрый', dirty: 'Грязный', mixed: 'Смешанный', dry: 'Сухой',
}

function FeedIcon({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    breast: { bg: 'bg-pink-100', color: 'text-pink-500' },
    bottle: { bg: 'bg-blue-100', color: 'text-blue-500' },
    pumped: { bg: 'bg-purple-100', color: 'text-purple-500' },
    solid: { bg: 'bg-orange-100', color: 'text-orange-500' },
  }
  const s = map[type] ?? map.breast
  return (
    <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
      <Milk size={15} className={s.color} />
    </div>
  )
}

function SleepIcon({ type }: { type: string }) {
  if (type === 'night') {
    return (
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
        <Moon size={15} className="text-indigo-500" />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
      <Sun size={15} className="text-amber-500" />
    </div>
  )
}

function DiaperIcon({ type }: { type: string }) {
  const map: Record<string, { bg: string; Icon: typeof Droplets; color: string }> = {
    wet: { bg: 'bg-blue-100', Icon: Droplets, color: 'text-blue-500' },
    dirty: { bg: 'bg-yellow-100', Icon: AlertCircle, color: 'text-yellow-600' },
    mixed: { bg: 'bg-orange-100', Icon: Layers, color: 'text-orange-500' },
    dry: { bg: 'bg-green-100', Icon: CheckCircle2, color: 'text-green-500' },
  }
  const s = map[type] ?? map.wet
  return (
    <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
      <s.Icon size={15} className={s.color} />
    </div>
  )
}

export function Timeline() {
  const { records: feedRecords } = useFeedingStore()
  const { records: sleepRecords } = useSleepStore()
  const { records: diaperRecords } = useDiaperStore()
  const { records: growthRecords } = useGrowthStore()
  const { notes } = useNotesStore()
  const { records: tummyRecords } = useTummyStore()

  const allEvents: EventItem[] = [
    ...feedRecords.map((r) => ({
      id: r.id,
      time: r.startTime,
      icon: <FeedIcon type={r.type} />,
      title: FEEDING_LABELS[r.type],
      subtitle: r.endTime
        ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)} · ${formatDuration(r.startTime, r.endTime)}`
        : `${formatTime(r.startTime)} · не завершено`,
      borderColor: 'border-l-pink-300',
    })),
    ...sleepRecords.map((r) => ({
      id: r.id,
      time: r.startTime,
      icon: <SleepIcon type={r.type} />,
      title: r.type === 'night' ? 'Ночной сон' : 'Дневной сон',
      subtitle: r.endTime
        ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)} · ${formatDuration(r.startTime, r.endTime)}`
        : `${formatTime(r.startTime)} · не завершён`,
      borderColor: 'border-l-purple-300',
    })),
    ...diaperRecords.map((r) => ({
      id: r.id,
      time: r.time,
      icon: <DiaperIcon type={r.type} />,
      title: `Подгузник · ${DIAPER_LABELS[r.type]}`,
      subtitle: formatTime(r.time),
      borderColor: 'border-l-blue-300',
    })),
    ...growthRecords.map((r) => ({
      id: r.id,
      time: r.date,
      icon: (
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Ruler size={15} className="text-emerald-500" />
        </div>
      ),
      title: 'Замер роста/веса',
      subtitle: [
        r.weight && `${(r.weight / 1000).toFixed(2)} кг`,
        r.height && `${r.height} см`,
        r.headCirc && `○ ${r.headCirc} см`,
      ].filter(Boolean).join(' · '),
      borderColor: 'border-l-emerald-300',
    })),
    ...tummyRecords.map((r) => ({
      id: r.id,
      time: r.startTime,
      icon: (
        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
          <FlipVertical2 size={15} className="text-orange-500" />
        </div>
      ),
      title: 'Время на животике',
      subtitle: r.endTime
        ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)} · ${formatDuration(r.startTime, r.endTime)}`
        : `${formatTime(r.startTime)} · не завершено`,
      borderColor: 'border-l-orange-300',
    })),
    ...notes.map((n) => ({
      id: n.id,
      time: n.createdAt,
      icon: (
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <PenLine size={15} className="text-amber-500" />
        </div>
      ),
      title: 'Заметка',
      subtitle: n.text,
      borderColor: 'border-l-amber-300',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  // Группируем по дням
  const grouped: Record<string, EventItem[]> = {}
  allEvents.forEach((e) => {
    const key = new Date(e.time).toDateString()
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  const days = Object.entries(grouped)

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="px-4 pb-24"
    >
      <div className="pt-12 pb-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
          <Clock size={16} className="text-pink-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">История</h1>
      </div>

      {days.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-pink-300" />
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Пока нет записей</p>
          <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Начните вести дневник</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {days.map(([dateKey, events]) => {
            const date = new Date(dateKey)
            const isToday = date.toDateString() === new Date().toDateString()
            const label = isToday ? 'Сегодня' : formatDate(dateKey)
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
                  <span className="text-xs text-gray-300 dark:text-gray-600">· {events.length} записей</span>
                </div>
                <motion.div
                  variants={listVariants}
                  initial="initial"
                  animate="animate"
                  className="space-y-1.5"
                >
                  {events.map((e) => (
                    <motion.div
                      key={e.id}
                      variants={itemSlideVariants}
                      className={`bg-white dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-50 dark:border-gray-700 border-l-4 ${e.borderColor} flex items-center gap-3`}
                    >
                      {e.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{e.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{e.subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
