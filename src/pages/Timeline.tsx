import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Clock, Milk, Moon, Sun, Droplets, AlertCircle, CheckCircle2, Layers, Ruler, Heart, PenLine, FlipVertical2, Footprints } from 'lucide-react'
import { ActionButtons } from '../components/ui/ActionButtons'
import { useFeedingStore } from '../store/feedingStore'
import { useSleepStore } from '../store/sleepStore'
import { useDiaperStore } from '../store/diaperStore'
import { useGrowthStore } from '../store/growthStore'
import { useNotesStore } from '../store/notesStore'
import { useTummyStore } from '../store/tummyStore'
import { useWalkStore } from '../store/walkStore'
import { Drawer } from '../components/common/Drawer'
import { formatTime, formatDate, formatDuration } from '../utils/formatTime'
import { pageVariants, listVariants, itemSlideVariants } from '../utils/animations'
import type { FeedingType, DiaperType, SleepType } from '../types'

// ── Типы ─────────────────────────────────────────────────

type EventKind = 'feeding' | 'sleep' | 'diaper' | 'growth' | 'tummy' | 'note' | 'walk'

type EventItem = {
  id: string
  kind: EventKind
  time: string
  icon: React.ReactNode
  title: string
  subtitle: string
  borderColor: string
  raw: Record<string, unknown>
}

// ── Константы ─────────────────────────────────────────────

const FEEDING_LABELS: Record<string, string> = {
  breast: 'Грудь', bottle: 'Смесь', pumped: 'Сцеженное', solid: 'Прикорм',
}
// breast/pumped kept for backward-compat display of existing records

const DIAPER_LABELS: Record<string, string> = {
  wet: 'Мокрый', dirty: 'Грязный', mixed: 'Смешанный', dry: 'Сухой',
}

const FEEDING_TYPES: { value: FeedingType; label: string }[] = [
  { value: 'bottle', label: 'Смесь' },
  { value: 'solid', label: 'Прикорм' },
]

const DIAPER_TYPES: { value: DiaperType; label: string; iconColor: string; bg: string; border: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'wet', label: 'Мокрый', iconColor: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', Icon: Droplets },
  { value: 'dirty', label: 'Грязный', iconColor: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', Icon: AlertCircle },
  { value: 'mixed', label: 'Смешанный', iconColor: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', Icon: Layers },
  { value: 'dry', label: 'Сухой', iconColor: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', Icon: CheckCircle2 },
]

// ── Иконки ─────────────────────────────────────────────────

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

// ── Утилиты ─────────────────────────────────────────────────

function isoToHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function applyHHMMToISO(base: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

// ── Компонент редактирования ─────────────────────────────────

type EditState = { kind: EventKind; raw: Record<string, unknown> } | null

function EditDrawer({ editState, onClose }: { editState: EditState; onClose: () => void }) {
  const { updateRecord: updateFeeding } = useFeedingStore()
  const { updateRecord: updateSleep } = useSleepStore()
  const { updateRecord: updateDiaper } = useDiaperStore()
  const { updateRecord: updateGrowth } = useGrowthStore()
  const { updateRecord: updateTummy } = useTummyStore()
  const { updateRecord: updateWalk } = useWalkStore()
  const { updateNote } = useNotesStore()

  const [fields, setFields] = useState<Record<string, string>>({})

  // При открытии — инициализируем поля из raw
  const [lastId, setLastId] = useState<string | null>(null)
  if (editState && editState.raw.id !== lastId) {
    const r = editState.raw
    const init: Record<string, string> = {}
    if (editState.kind === 'feeding') {
      init.type = (r.type as string) ?? 'bottle'
      init.amount = r.amount ? String(r.amount) : ''
      init.startTime = isoToHHMM(r.startTime as string)
      init.endTime = r.endTime ? isoToHHMM(r.endTime as string) : ''
      init.notes = (r.notes as string) ?? ''
    } else if (editState.kind === 'sleep') {
      init.type = (r.type as string) ?? 'nap'
      init.startTime = isoToHHMM(r.startTime as string)
      init.endTime = r.endTime ? isoToHHMM(r.endTime as string) : ''
    } else if (editState.kind === 'diaper') {
      init.type = (r.type as string) ?? 'wet'
      init.time = isoToHHMM(r.time as string)
      init.notes = (r.notes as string) ?? ''
    } else if (editState.kind === 'growth') {
      init.weight = r.weight ? String((r.weight as number) / 1000) : ''
      init.height = r.height ? String(r.height) : ''
      init.headCirc = r.headCirc ? String(r.headCirc) : ''
      init.notes = (r.notes as string) ?? ''
    } else if (editState.kind === 'tummy') {
      init.startTime = isoToHHMM(r.startTime as string)
      init.endTime = r.endTime ? isoToHHMM(r.endTime as string) : ''
    } else if (editState.kind === 'walk') {
      init.startTime = isoToHHMM(r.startTime as string)
      init.endTime = r.endTime ? isoToHHMM(r.endTime as string) : ''
      init.notes = (r.notes as string) ?? ''
    } else if (editState.kind === 'note') {
      init.text = (r.text as string) ?? ''
      init.date = (r.date as string) ?? new Date().toISOString().slice(0, 10)
    }
    setFields(init)
    setLastId(r.id as string)
  }

  function set(key: string, val: string) {
    setFields((prev) => ({ ...prev, [key]: val }))
  }

  function handleSave() {
    if (!editState) return
    const r = editState.raw
    const id = r.id as string

    try {
      if (editState.kind === 'feeding') {
        updateFeeding(id, {
          type: fields.type as FeedingType,
          amount: fields.amount ? parseFloat(fields.amount) : undefined,
          startTime: applyHHMMToISO(r.startTime as string, fields.startTime),
          endTime: fields.endTime ? applyHHMMToISO((r.endTime ?? r.startTime) as string, fields.endTime) : undefined,
          notes: fields.notes.trim() || undefined,
        })
      } else if (editState.kind === 'sleep') {
        updateSleep(id, {
          type: fields.type as SleepType,
          startTime: applyHHMMToISO(r.startTime as string, fields.startTime),
          endTime: fields.endTime ? applyHHMMToISO((r.endTime ?? r.startTime) as string, fields.endTime) : undefined,
        })
      } else if (editState.kind === 'diaper') {
        updateDiaper(id, {
          type: fields.type as DiaperType,
          time: applyHHMMToISO(r.time as string, fields.time),
          notes: fields.notes.trim() || undefined,
        })
      } else if (editState.kind === 'growth') {
        updateGrowth(id, {
          weight: fields.weight ? Math.round(parseFloat(fields.weight) * 1000) : undefined,
          height: fields.height ? parseFloat(fields.height) : undefined,
          headCirc: fields.headCirc ? parseFloat(fields.headCirc) : undefined,
          notes: fields.notes?.trim() || undefined,
        })
      } else if (editState.kind === 'tummy') {
        updateTummy(id, {
          startTime: applyHHMMToISO(r.startTime as string, fields.startTime),
          endTime: fields.endTime ? applyHHMMToISO((r.endTime ?? r.startTime) as string, fields.endTime) : undefined,
        })
      } else if (editState.kind === 'walk') {
        updateWalk(id, {
          startTime: applyHHMMToISO(r.startTime as string, fields.startTime),
          endTime: fields.endTime ? applyHHMMToISO((r.endTime ?? r.startTime) as string, fields.endTime) : undefined,
          notes: fields.notes?.trim() || undefined,
        })
      } else if (editState.kind === 'note') {
        updateNote(id, fields.text, fields.date)
      }
      toast.success('Запись обновлена')
      onClose()
    } catch {
      toast.error('Ошибка при сохранении')
    }
  }

  const inputCls = 'border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 w-full'
  const labelCls = 'text-xs text-gray-500 dark:text-gray-400 mb-1'

  function renderFields() {
    if (!editState) return null

    if (editState.kind === 'feeding') {
      return (
        <>
          <div>
            <p className={labelCls}>Тип</p>
            <div className="flex gap-2 flex-wrap">
              {FEEDING_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => set('type', t.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${fields.type === t.value ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {fields.type === 'bottle' && (
            <div>
              <p className={labelCls}>Объём (мл)</p>
              <input type="number" value={fields.amount ?? ''} onChange={(e) => set('amount', e.target.value)} placeholder="например: 120" className={inputCls} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 overflow-hidden">
              <p className={labelCls}>Начало</p>
              <input type="time" value={fields.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputCls} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className={labelCls}>Конец</p>
              <input type="time" value={fields.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <p className={labelCls}>Заметка</p>
            <textarea value={fields.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </>
      )
    }

    if (editState.kind === 'sleep') {
      return (
        <>
          <div>
            <p className={labelCls}>Тип</p>
            <div className="flex gap-2">
              {(['nap', 'night'] as SleepType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => set('type', t)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${fields.type === t ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {t === 'night' ? 'Ночной' : 'Дневной'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className={labelCls}>Начало</p>
              <input type="time" value={fields.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputCls} />
            </div>
            <div className="min-w-0">
              <p className={labelCls}>Конец</p>
              <input type="time" value={fields.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputCls} />
            </div>
          </div>
        </>
      )
    }

    if (editState.kind === 'diaper') {
      return (
        <>
          <div>
            <p className={labelCls}>Тип</p>
            <div className="grid grid-cols-2 gap-2">
              {DIAPER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => set('type', t.value)}
                  className={`${t.bg} ${t.border} border-2 rounded-2xl p-2.5 text-left transition-opacity ${fields.type === t.value ? 'opacity-100' : 'opacity-40'}`}
                >
                  <t.Icon size={16} className={t.iconColor} />
                  <p className="text-xs font-semibold mt-1 text-gray-700">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={labelCls}>Время</p>
            <input type="time" value={fields.time} onChange={(e) => set('time', e.target.value)} className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>Комментарий</p>
            <textarea value={fields.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </>
      )
    }

    if (editState.kind === 'growth') {
      return (
        <>
          <div>
            <p className={labelCls}>Вес (кг)</p>
            <input type="number" step="0.001" value={fields.weight} onChange={(e) => set('weight', e.target.value)} placeholder="напр. 3.5" className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>Рост (см)</p>
            <input type="number" step="0.1" value={fields.height} onChange={(e) => set('height', e.target.value)} placeholder="напр. 52" className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>Обхват головы (см)</p>
            <input type="number" step="0.1" value={fields.headCirc} onChange={(e) => set('headCirc', e.target.value)} placeholder="напр. 35" className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>Комментарий</p>
            <textarea value={fields.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </>
      )
    }

    if (editState.kind === 'tummy') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className={labelCls}>Начало</p>
            <input type="time" value={fields.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputCls} />
          </div>
          <div className="min-w-0">
            <p className={labelCls}>Конец</p>
            <input type="time" value={fields.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputCls} />
          </div>
        </div>
      )
    }

    if (editState.kind === 'walk') {
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className={labelCls}>Начало</p>
              <input type="time" value={fields.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputCls} />
            </div>
            <div className="min-w-0">
              <p className={labelCls}>Конец</p>
              <input type="time" value={fields.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <p className={labelCls}>Заметка</p>
            <textarea value={fields.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </>
      )
    }

    if (editState.kind === 'note') {
      return (
        <>
          <div>
            <p className={labelCls}>Дата</p>
            <input type="date" value={fields.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>Текст</p>
            <textarea value={fields.text} onChange={(e) => set('text', e.target.value)} rows={4} className={`${inputCls} resize-none`} />
          </div>
        </>
      )
    }

    return null
  }

  const titleMap: Record<EventKind, string> = {
    feeding: 'Редактировать кормление',
    sleep: 'Редактировать сон',
    diaper: 'Редактировать подгузник',
    growth: 'Редактировать замер',
    tummy: 'Редактировать животик',
    walk: 'Редактировать прогулку',
    note: 'Редактировать заметку',
  }

  return (
    <Drawer open={!!editState} onClose={onClose} title={editState ? titleMap[editState.kind] : ''}>
      <div className="space-y-4 pb-2">
        {renderFields()}
        <button
          onClick={handleSave}
          className="w-full bg-pink-500 text-white py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Сохранить
        </button>
      </div>
    </Drawer>
  )
}

// ── Основной компонент ─────────────────────────────────────

export function Timeline() {
  const { records: feedRecords, deleteRecord: deleteFeedingRecord } = useFeedingStore()
  const { records: sleepRecords, deleteRecord: deleteSleepRecord } = useSleepStore()
  const { records: diaperRecords, deleteRecord: deleteDiaperRecord } = useDiaperStore()
  const { records: growthRecords, deleteRecord: deleteGrowthRecord } = useGrowthStore()
  const { notes, deleteNote } = useNotesStore()
  const { records: tummyRecords, deleteRecord: deleteTummyRecord } = useTummyStore()
  const { records: walkRecords, deleteRecord: deleteWalkRecord } = useWalkStore()

  const [editState, setEditState] = useState<EditState>(null)

  function handleDelete(kind: EventKind, id: string) {
    const map: Record<EventKind, (id: string) => void> = {
      feeding: deleteFeedingRecord,
      sleep: deleteSleepRecord,
      diaper: deleteDiaperRecord,
      growth: deleteGrowthRecord,
      tummy: deleteTummyRecord,
      walk: deleteWalkRecord,
      note: deleteNote,
    }
    map[kind](id)
    toast.error('Запись удалена')
  }

  const allEvents: EventItem[] = [
    ...feedRecords.map((r) => ({
      id: r.id,
      kind: 'feeding' as EventKind,
      time: r.startTime,
      icon: <FeedIcon type={r.type} />,
      title: FEEDING_LABELS[r.type],
      subtitle: [
        r.endTime
          ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)} · ${formatDuration(r.startTime, r.endTime)}`
          : `${formatTime(r.startTime)} · не завершено`,
        r.amount ? `${r.amount} мл` : null,
        r.type === 'solid' && r.notes ? r.notes : null,
      ].filter(Boolean).join(' · '),
      borderColor: 'border-l-pink-300',
      raw: r as unknown as Record<string, unknown>,
    })),
    ...sleepRecords.map((r) => ({
      id: r.id,
      kind: 'sleep' as EventKind,
      time: r.startTime,
      icon: <SleepIcon type={r.type} />,
      title: r.type === 'night' ? 'Ночной сон' : 'Дневной сон',
      subtitle: r.endTime
        ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)} · ${formatDuration(r.startTime, r.endTime)}`
        : `${formatTime(r.startTime)} · не завершён`,
      borderColor: 'border-l-purple-300',
      raw: r as unknown as Record<string, unknown>,
    })),
    ...diaperRecords.map((r) => ({
      id: r.id,
      kind: 'diaper' as EventKind,
      time: r.time,
      icon: <DiaperIcon type={r.type} />,
      title: `Подгузник · ${DIAPER_LABELS[r.type]}`,
      subtitle: formatTime(r.time),
      borderColor: 'border-l-blue-300',
      raw: r as unknown as Record<string, unknown>,
    })),
    ...growthRecords.map((r) => ({
      id: r.id,
      kind: 'growth' as EventKind,
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
      raw: r as unknown as Record<string, unknown>,
    })),
    ...tummyRecords.map((r) => ({
      id: r.id,
      kind: 'tummy' as EventKind,
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
      raw: r as unknown as Record<string, unknown>,
    })),
    ...walkRecords.map((r) => ({
      id: r.id,
      kind: 'walk' as EventKind,
      time: r.startTime,
      icon: (
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
          <Footprints size={15} className="text-green-500" />
        </div>
      ),
      title: 'Прогулка',
      subtitle: r.endTime
        ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)} · ${formatDuration(r.startTime, r.endTime)}${r.notes ? ` · ${r.notes}` : ''}`
        : `${formatTime(r.startTime)} · не завершена`,
      borderColor: 'border-l-green-300',
      raw: r as unknown as Record<string, unknown>,
    })),
    ...notes.map((n) => ({
      id: n.id,
      kind: 'note' as EventKind,
      time: n.createdAt,
      icon: (
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
          <PenLine size={15} className="text-amber-500" />
        </div>
      ),
      title: 'Заметка',
      subtitle: n.text,
      borderColor: 'border-l-amber-300',
      raw: n as unknown as Record<string, unknown>,
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
    <>
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
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{e.subtitle}</p>
                      </div>
                      <ActionButtons
                        onEdit={() => setEditState({ kind: e.kind, raw: e.raw })}
                        onDelete={() => handleDelete(e.kind, e.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>

    <EditDrawer editState={editState} onClose={() => setEditState(null)} />
    </>
  )
}
