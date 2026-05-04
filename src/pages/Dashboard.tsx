import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Milk, BedDouble, Droplets, Ruler, Sun, Moon, Baby, AlertCircle, Clock, BellRing, PenLine, Plus, FlipVertical2, Footprints } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useChildStore } from '../store/childStore'
import { useFeedingStore } from '../store/feedingStore'
import { useSleepStore } from '../store/sleepStore'
import { useDiaperStore } from '../store/diaperStore'
import { useGrowthStore } from '../store/growthStore'
import { useNotesStore } from '../store/notesStore'
import { ActionButtons } from '../components/ui/ActionButtons'
import { useHealthStore } from '../store/healthStore'
import { useWalkStore } from '../store/walkStore'
import { Card } from '../components/common/Card'
import { Drawer } from '../components/common/Drawer'
import { Timer } from '../components/common/Timer'
import { format, differenceInMinutes, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
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
  const { theme, toggleTheme } = useThemeStore()
  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [editNote, setEditNote] = useState<{ id: string; text: string; date: string; folderId?: string } | null>(null)
  const [noteFolderId, setNoteFolderId] = useState<string | undefined>(undefined)
  const { notes, folders, addNote, updateNote, deleteNote } = useNotesStore()
  const { getTodayDoses } = useHealthStore()
  const { child } = useChildStore()
  const { records: feedRecords, activeFeeding } = useFeedingStore()
  const { records: sleepRecords, activeSleep } = useSleepStore()
  const { activeWalk } = useWalkStore()
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

  const totalMlToday = todayFeedings
    .filter((r) => r.type === 'bottle')
    .reduce((acc, r) => acc + (r.amount ?? 0), 0)

  const totalSleepMin = todaySleep.reduce((acc, r) => {
    if (!r.endTime) return acc
    return acc + Math.floor(
      (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000
    )
  }, 0)

  const hoursSinceLastFeed = lastFeeding
    ? getHoursSince(lastFeeding.endTime ?? lastFeeding.startTime)
    : null

  // Умные подсказки
  const now = new Date()

  // 1. Кормление
  const feedingHint = (() => {
    if (activeFeeding) return null
    if (hoursSinceLastFeed === null) return { level: 'neutral' as const, text: 'Кормлений ещё не было' }
    if (hoursSinceLastFeed < 2.5) return null
    if (hoursSinceLastFeed < 3.5) return { level: 'warn' as const, text: `Скоро пора кормить · ${hoursSinceLastFeed.toFixed(1)} ч назад` }
    return { level: 'alert' as const, text: `Пора кормить! · ${hoursSinceLastFeed.toFixed(1)} ч назад` }
  })()

  // 2. Бодрствование
  const awakeHint = (() => {
    if (activeSleep) return null
    const lastSleepEnd = [...sleepRecords]
      .filter((r) => r.endTime)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())[0]
    if (!lastSleepEnd?.endTime) return null
    const awakeMin = differenceInMinutes(now, parseISO(lastSleepEnd.endTime))
    if (awakeMin < 90) return null
    const h = Math.floor(awakeMin / 60)
    const m = awakeMin % 60
    const label = h > 0 ? `${h} ч ${m} мин` : `${m} мин`
    return { level: 'warn' as const, text: `${child.name} бодрствует уже ${label}` }
  })()

  // 3. Подгузник
  const diaperHint = (() => {
    const lastDiaper = todayDiapers[0]
    if (!lastDiaper) return null
    const hoursAgo = getHoursSince(lastDiaper.time)
    if (hoursAgo < 3) return null
    return { level: 'warn' as const, text: `Проверь подгузник · ${hoursAgo.toFixed(0)} ч назад` }
  })()

  // 4. Паттерн засыпания
  const sleepPatternHint = (() => {
    const nightSleeps = sleepRecords.filter((r) => r.type === 'night' && r.endTime).slice(0, 7)
    if (nightSleeps.length < 3) return null
    const avgMinutes = nightSleeps.reduce((acc, r) => {
      const d = new Date(r.startTime)
      return acc + d.getHours() * 60 + d.getMinutes()
    }, 0) / nightSleeps.length
    const h = Math.floor(avgMinutes / 60) % 24
    const m = Math.round(avgMinutes % 60)
    return { level: 'info' as const, text: `Обычно засыпает около ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
  })()

  const todayStr = now.toISOString().slice(0, 10)
  const sortedNotes = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const pendingDoses = getTodayDoses(todayStr).filter((d) => !d.log)

  const medsHint = pendingDoses.length > 0
    ? { level: 'warn' as const, text: `Лекарства: ${pendingDoses.length} доз осталось` }
    : null

  const hints = [feedingHint, awakeHint, diaperHint, sleepPatternHint, medsHint].filter(Boolean) as {
    level: 'neutral' | 'warn' | 'alert' | 'info'; text: string
  }[]

  function handleAddNote() {
    if (!noteText.trim()) return
    addNote(noteText.trim(), noteDate, noteFolderId)
    setNoteText('')
    setNoteDate(new Date().toISOString().slice(0, 10))
    setNoteFolderId(undefined)
    setNoteDrawerOpen(false)
  }

  function handleSaveEditNote() {
    if (!editNote || !editNote.text.trim()) return
    updateNote(editNote.id, editNote.text.trim(), editNote.date, editNote.folderId)
    setEditNote(null)
  }

  function openNoteDrawer() {
    setNoteDate(new Date().toISOString().slice(0, 10))
    setNoteText('')
    setNoteFolderId(undefined)
    setNoteDrawerOpen(true)
  }

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
      <div className="pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-500">Сегодня, {format(new Date(), 'd MMMM', { locale: ru })}</p>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Привет, мама Стейси 🤍</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full bg-pink-50 dark:bg-gray-800 border border-pink-100 dark:border-gray-700 flex items-center justify-center"
          >
            {theme === 'dark'
              ? <Sun size={20} className="text-amber-400" strokeWidth={1.8} />
              : <Moon size={20} className="text-gray-400" strokeWidth={1.8} />
            }
          </motion.button>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 inline-flex items-center gap-2 bg-pink-50 dark:bg-pink-950 rounded-full px-2.5 py-1.5"
        >
          <div className="w-12 h-12 rounded-full bg-pink-200 dark:bg-pink-900 overflow-hidden flex items-center justify-center shrink-0">
            {child.photoURI
              ? <img src={child.photoURI} alt={child.name} className="w-full h-full object-cover" />
              : <Baby size={22} className="text-pink-400" />
            }
          </div>
          <span className="text-sm font-medium text-pink-600 dark:text-pink-300">
            {child.name} · {formatAge(child.birthDate)}
          </span>
        </motion.div>
      </div>

      {/* Активные таймеры */}
      {(activeFeeding || activeSleep || activeWalk) && (
        <div className="mb-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Активно сейчас</p>

          {activeFeeding && (
            <Card className="border-pink-200 bg-pink-50 dark:bg-pink-950 dark:border-pink-900" onClick={() => navigate('/feeding')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                    <Milk size={20} className="text-pink-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                      {FEEDING_LABELS[activeFeeding.type]}
                      {activeFeeding.side ? ` · ${SIDE_LABELS[activeFeeding.side]}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{activeFeeding.pausedAt ? 'на паузе' : 'кормление идёт'}</p>
                  </div>
                </div>
                <Timer startTime={activeFeeding.startTime} pausedMs={activeFeeding.pausedMs} pausedAt={activeFeeding.pausedAt} className="text-pink-500 font-bold text-lg" showPulse />
              </div>
            </Card>
          )}

          {activeSleep && (
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-900" onClick={() => navigate('/sleep')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <BedDouble size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                      {activeSleep.type === 'night' ? 'Ночной сон' : 'Дневной сон'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{activeSleep.pausedAt ? 'на паузе' : 'спит'}</p>
                  </div>
                </div>
                <Timer startTime={activeSleep.startTime} pausedMs={activeSleep.pausedMs} pausedAt={activeSleep.pausedAt} className="text-purple-500 font-bold text-lg" showPulse pulseColor="purple" />
              </div>
            </Card>
          )}

          {activeWalk && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900" onClick={() => navigate('/walk')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Footprints size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">Прогулка</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">идёт</p>
                  </div>
                </div>
                <Timer startTime={activeWalk.startTime} className="text-green-500 font-bold text-lg" showPulse />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Умные подсказки */}
      {hints.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Подсказки</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {hints.map((hint, i) => {
              const styles = {
                alert: { bg: 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900', text: 'text-red-600 dark:text-red-300', icon: <AlertCircle size={14} className="text-red-400 shrink-0" /> },
                warn: { bg: 'bg-amber-50 dark:bg-amber-950 border-amber-100 dark:border-amber-900', text: 'text-amber-700 dark:text-amber-300', icon: <BellRing size={14} className="text-amber-400 shrink-0" /> },
                info: { bg: 'bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900', text: 'text-blue-600 dark:text-blue-300', icon: <Clock size={14} className="text-blue-400 shrink-0" /> },
                neutral: { bg: 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: <Clock size={14} className="text-gray-400 shrink-0" /> },
              }[hint.level]
              return (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${styles.bg} shrink-0 max-w-[240px]`}>
                  {styles.icon}
                  <span className={`text-xs font-medium ${styles.text} leading-snug`}>{hint.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Сводка дня */}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">За сегодня</p>
      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<Milk size={22} />}
            label="Кормлений"
            value={totalMlToday > 0 ? `${totalMlToday} мл` : String(todayFeedings.length)}
            sub={totalMlToday > 0 ? `${todayFeedings.length} раз` : (hoursSinceLastFeed !== null ? (hoursSinceLastFeed < 1 ? 'только что' : `${hoursSinceLastFeed} ч назад`) : 'не было')}
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
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Быстро добавить</p>
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
          { icon: <FlipVertical2 size={22} className="text-orange-500" />, label: 'Животик', path: '/tummy' },
          { icon: <Footprints size={22} className="text-green-500" />, label: 'Прогулка', path: '/walk' },
        ].map((item) => (
          <motion.div key={item.path} variants={itemVariants}>
            <QuickButton icon={item.icon} label={item.label} onClick={() => navigate(item.path)} />
          </motion.div>
        ))}
      </motion.div>

      {/* Заметки */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Заметки</p>
          <div className="flex items-center gap-3">
            <button
              onClick={openNoteDrawer}
              className="flex items-center gap-1 text-xs text-pink-500 font-medium"
            >
              <Plus size={13} /> Добавить
            </button>
            <button
              onClick={() => navigate('/notes')}
              className="text-xs text-pink-500 font-medium"
            >
              Все →
            </button>
          </div>
        </div>
        {sortedNotes.length === 0 ? (
          <button
            onClick={openNoteDrawer}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-pink-200 dark:border-gray-600 text-sm text-gray-400 dark:text-gray-500"
          >
            <PenLine size={15} className="text-pink-300" />
            Нет заметок — добавь первую...
          </button>
        ) : (
          <div className="space-y-2">
            {sortedNotes.slice(0, 2).map((note) => (
              <div key={note.id} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl px-3 py-2.5">
                <PenLine size={15} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-500 dark:text-amber-400 font-medium mb-0.5">
                    {note.date === todayStr
                      ? 'Сегодня'
                      : format(new Date(note.date + 'T12:00:00'), 'd MMMM', { locale: ru })}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{note.text}</p>
                </div>
                <ActionButtons
                  onEdit={() => setEditNote({ id: note.id, text: note.text, date: note.date, folderId: note.folderId })}
                  onDelete={() => deleteNote(note.id)}
                  editColor="hover:text-amber-400"
                />
              </div>
            ))}
            {sortedNotes.length > 2 && (
              <button
                onClick={() => navigate('/notes')}
                className="text-xs text-pink-500 font-medium px-1"
              >
                Ещё {sortedNotes.length - 2} заметок →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Последние события */}
      {feedRecords.length + sleepRecords.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Последние записи</p>
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

    <Drawer open={noteDrawerOpen} onClose={() => setNoteDrawerOpen(false)} title="Новая заметка">
      <div className="space-y-3 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Дата</span>
          <input
            type="date"
            value={noteDate}
            onChange={(e) => setNoteDate(e.target.value)}
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 flex-1"
          />
        </div>
        {folders.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Папка</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setNoteFolderId(undefined)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!noteFolderId ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              >
                Без папки
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setNoteFolderId(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${noteFolderId === f.id ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Что хочешь записать?"
          rows={4}
          className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
        />
        <button
          onClick={handleAddNote}
          disabled={!noteText.trim()}
          className="w-full bg-pink-500 disabled:bg-pink-200 dark:disabled:bg-pink-900/40 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Сохранить
        </button>
      </div>
    </Drawer>

    <Drawer open={!!editNote} onClose={() => setEditNote(null)} title="Редактировать заметку">
      {editNote && (
        <div className="space-y-3 pb-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Дата</span>
            <input
              type="date"
              value={editNote.date}
              onChange={(e) => setEditNote({ ...editNote, date: e.target.value })}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 flex-1"
            />
          </div>
          {folders.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Папка</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setEditNote({ ...editNote, folderId: undefined })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!editNote.folderId ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  Без папки
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEditNote({ ...editNote, folderId: f.id })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${editNote.folderId === f.id ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <textarea
            value={editNote.text}
            onChange={(e) => setEditNote({ ...editNote, text: e.target.value })}
            rows={4}
            className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
          />
          <button
            onClick={handleSaveEditNote}
            disabled={!editNote.text.trim()}
            className="w-full bg-pink-500 disabled:bg-pink-200 dark:disabled:bg-pink-900/40 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Сохранить
          </button>
        </div>
      )}
    </Drawer>
    </>
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
    pink: 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-300',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300',
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300',
    green: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300',
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
      className="bg-white dark:bg-gray-800 border border-pink-100 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 text-left shadow-sm w-full"
    >
      {icon}
      <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{label}</span>
    </motion.button>
  )
}

function RecentItem({ icon, title, sub, time }: { icon: React.ReactNode; title: string; sub: string; time: string }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-pink-50 dark:border-gray-700">
      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{time}</span>
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
