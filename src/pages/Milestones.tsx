import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInMonths, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Check, Plus, Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  useMilestonesStore,
  PREDEFINED_MILESTONES,
  type MilestoneCategory,
  type Milestone,
} from '../store/milestonesStore'
import { Drawer } from '../components/common/Drawer'

const CHILD_BIRTH_DATE = new Date('2026-03-29')
const CHILD_NAME = 'Николь'

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  motor: 'Двигательные',
  social: 'Социальные',
  speech: 'Речевые',
  cognitive: 'Познавательные',
}

const CATEGORY_COLORS: Record<MilestoneCategory, { bg: string; text: string; dot: string }> = {
  motor: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-300', dot: 'bg-pink-400' },
  social: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-300', dot: 'bg-amber-400' },
  speech: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-300', dot: 'bg-purple-400' },
  cognitive: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-300', dot: 'bg-sky-400' },
}

function babyAge(birthDate: Date, now = new Date()) {
  const months = differenceInMonths(now, birthDate)
  const days = differenceInDays(now, birthDate)
  if (days < 30) return `${days} ${dayWord(days)}`
  const m = months
  return `${m} ${monthWord(m)}`
}

function dayWord(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'дня'
  return 'дней'
}

function monthWord(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'месяц'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'месяца'
  return 'месяцев'
}

function groupByMonth(milestones: Milestone[]) {
  const groups: Record<number, Milestone[]> = {}
  for (const m of milestones) {
    const key = m.monthMin
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return groups
}

function monthRangeLabel(monthMin: number, monthMax: number) {
  if (monthMin === monthMax) return `${monthMin} мес.`
  return `${monthMin}–${monthMax} мес.`
}

type FilterType = 'all' | 'upcoming' | 'achieved'

export function Milestones() {
  const { achievements, customMilestones, markAchieved, unmarkAchieved, addCustomMilestone, removeCustomMilestone } = useMilestonesStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [confirmDrawerOpen, setConfirmDrawerOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [achievedDate, setAchievedDate] = useState('')
  const [achievedNotes, setAchievedNotes] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())

  // Custom milestone form
  const [customTitle, setCustomTitle] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customCategory, setCustomCategory] = useState<MilestoneCategory>('motor')
  const [customMonthMin, setCustomMonthMin] = useState('0')
  const [customMonthMax, setCustomMonthMax] = useState('1')

  const now = new Date()
  const currentMonths = differenceInMonths(now, CHILD_BIRTH_DATE)

  const allMilestones = [...PREDEFINED_MILESTONES, ...customMilestones]
  const achievedIds = new Set(achievements.map((a) => a.milestoneId))

  const filtered = allMilestones.filter((m) => {
    if (filter === 'achieved') return achievedIds.has(m.id)
    if (filter === 'upcoming') return !achievedIds.has(m.id)
    return true
  })

  const totalCount = allMilestones.length
  const achievedCount = achievedIds.size

  const groups = groupByMonth(filtered)
  const sortedGroupKeys = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)

  function toggleGroup(key: number) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function openConfirm(m: Milestone) {
    setSelectedMilestone(m)
    setAchievedDate(new Date().toISOString().slice(0, 10))
    setAchievedNotes('')
    setConfirmDrawerOpen(true)
  }

  function handleMarkAchieved() {
    if (!selectedMilestone) return
    markAchieved(selectedMilestone.id, new Date(achievedDate).toISOString(), achievedNotes || undefined)
    setConfirmDrawerOpen(false)
  }

  function handleAddCustom() {
    if (!customTitle.trim()) return
    addCustomMilestone({
      title: customTitle.trim(),
      description: customDesc.trim(),
      category: customCategory,
      monthMin: Number(customMonthMin),
      monthMax: Number(customMonthMax),
    })
    setCustomTitle('')
    setCustomDesc('')
    setCustomCategory('motor')
    setCustomMonthMin('0')
    setCustomMonthMax('1')
    setAddDrawerOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-24"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Этапы развития</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {CHILD_NAME} · {babyAge(CHILD_BIRTH_DATE)}
            </p>
          </div>
          <button
            onClick={() => setAddDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-pink-500 text-white px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform"
          >
            <Plus size={16} />
            Свой этап
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-pink-100 dark:border-gray-700 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Прогресс</span>
            <span className="text-sm font-bold text-pink-500">{achievedCount} / {totalCount}</span>
          </div>
          <div className="h-2.5 bg-pink-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: totalCount > 0 ? `${(achievedCount / totalCount) * 100}%` : '0%' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex gap-3 mt-3">
            {(Object.keys(CATEGORY_LABELS) as MilestoneCategory[]).map((cat) => {
              const catAchieved = achievements.filter((a) => {
                const m = allMilestones.find((m) => m.id === a.milestoneId)
                return m?.category === cat
              }).length
              const catTotal = allMilestones.filter((m) => m.category === cat).length
              const colors = CATEGORY_COLORS[cat]
              return (
                <div key={cat} className="flex-1 text-center">
                  <div className={`w-2 h-2 rounded-full ${colors.dot} mx-auto mb-1`} />
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">{catAchieved}/{catTotal}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'upcoming', 'achieved'] as FilterType[]).map((f) => {
            const labels = { all: 'Все', upcoming: 'Впереди', achieved: 'Достигнуто' }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-pink-100 dark:border-gray-700'
                }`}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Milestone groups */}
      <div className="px-4 space-y-4">
        {sortedGroupKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Star size={40} className="text-pink-200 dark:text-pink-900 mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Нет этапов для отображения</p>
          </div>
        )}

        {sortedGroupKeys.map((monthKey) => {
          const items = groups[monthKey]
          const isCurrentGroup = currentMonths >= monthKey && currentMonths <= monthKey + 2
          const collapsed = collapsedGroups.has(monthKey)

          return (
            <div key={monthKey} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleGroup(monthKey)}
                className={`w-full flex items-center justify-between px-4 py-3 ${
                  isCurrentGroup ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCurrentGroup && (
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                  )}
                  <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                    {monthKey === 0 ? 'Первый месяц' : `${monthKey}–${monthKey + 2} месяца`}
                  </span>
                  {isCurrentGroup && (
                    <span className="text-[10px] bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300 px-2 py-0.5 rounded-full font-medium">
                      сейчас
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {items.filter((m) => achievedIds.has(m.id)).length}/{items.length}
                  </span>
                  {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-pink-50 dark:divide-gray-700">
                      {items.map((milestone) => {
                        const achieved = achievedIds.has(milestone.id)
                        const achievement = achievements.find((a) => a.milestoneId === milestone.id)
                        const colors = CATEGORY_COLORS[milestone.category]

                        return (
                          <div key={milestone.id} className="px-4 py-3 flex items-start gap-3">
                            {/* Check button */}
                            <button
                              onClick={() => achieved ? unmarkAchieved(milestone.id) : openConfirm(milestone)}
                              className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                                achieved
                                  ? 'bg-green-400 border-green-400'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {achieved && <Check size={13} className="text-white" strokeWidth={3} />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className={`text-sm font-medium leading-snug ${achieved ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                                    {milestone.title}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                                    {milestone.description}
                                  </p>
                                  {achieved && achievement && (
                                    <p className="text-xs text-green-500 mt-1 font-medium">
                                      ✓ {format(new Date(achievement.achievedDate), 'd MMMM yyyy', { locale: ru })}
                                      {achievement.notes && ` · ${achievement.notes}`}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                                    {CATEGORY_LABELS[milestone.category].slice(0, 3)}.
                                  </span>
                                  {milestone.isCustom && (
                                    <button
                                      onClick={() => removeCustomMilestone(milestone.id)}
                                      className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {!achieved && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {monthRangeLabel(milestone.monthMin, milestone.monthMax)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Mark achieved drawer */}
      <Drawer open={confirmDrawerOpen} onClose={() => setConfirmDrawerOpen(false)} title="Отметить достижение">
        {selectedMilestone && (
          <div className="space-y-4">
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedMilestone.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedMilestone.description}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">Дата достижения</label>
              <input
                type="date"
                value={achievedDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setAchievedDate(e.target.value)}
                className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">Заметка (необязательно)</label>
              <input
                type="text"
                value={achievedNotes}
                onChange={(e) => setAchievedNotes(e.target.value)}
                placeholder="Как это было..."
                className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <button
              onClick={handleMarkAchieved}
              className="w-full bg-pink-500 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
            >
              Сохранить
            </button>
          </div>
        )}
      </Drawer>

      {/* Add custom milestone drawer */}
      <Drawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)} title="Свой этап">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">Название *</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Например: Первый зуб"
              className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">Описание</label>
            <input
              type="text"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Подробности..."
              className="w-full border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">Категория</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_LABELS) as MilestoneCategory[]).map((cat) => {
                const colors = CATEGORY_COLORS[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => setCustomCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                      customCategory === cat
                        ? `${colors.bg} ${colors.text} border-transparent`
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">Ожидаемый возраст (месяцы)</label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={customMonthMin}
                min="0"
                max="36"
                onChange={(e) => setCustomMonthMin(e.target.value)}
                className="flex-1 border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300 text-center"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                value={customMonthMax}
                min="0"
                max="36"
                onChange={(e) => setCustomMonthMax(e.target.value)}
                className="flex-1 border border-pink-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-300 text-center"
              />
            </div>
          </div>

          <button
            onClick={handleAddCustom}
            disabled={!customTitle.trim()}
            className="w-full bg-pink-500 disabled:bg-pink-200 dark:disabled:bg-pink-900/40 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
          >
            Добавить
          </button>
        </div>
      </Drawer>
    </motion.div>
  )
}
