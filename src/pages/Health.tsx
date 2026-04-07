import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ChevronLeft, Thermometer, Pill, Syringe,
  Trash2, CheckCircle2, Circle, Plus, Clock, XCircle, CalendarClock, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useHealthStore } from '../store/healthStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Drawer } from '../components/common/Drawer'
import { formatDateTime, formatDate } from '../utils/formatTime'
import { pageVariants, listVariants, itemVariants } from '../utils/animations'

type Tab = 'temp' | 'meds' | 'vaccines'

// Цвет температуры
function tempColor(t: number): string {
  if (t < 37.5) return 'text-emerald-600'
  if (t < 38) return 'text-amber-500'
  return 'text-red-500'
}
function tempBg(t: number): string {
  if (t < 37.5) return 'bg-emerald-50'
  if (t < 38) return 'bg-amber-50'
  return 'bg-red-50'
}
function tempLabel(t: number): string {
  if (t < 37.5) return 'норма'
  if (t < 38) return 'субфебрильная'
  return 'высокая'
}

export function Health() {
  const navigate = useNavigate()
  const {
    temps, medications, vaccines,
    scheduledMeds,
    addTemp, deleteTemp,
    addMedication, deleteMedication,
    markVaccineDone, markVaccineUndone, addVaccine, deleteVaccine,
    addScheduledMed, removeScheduledMed, toggleScheduledMed, logDose, skipDose, getTodayDoses,
  } = useHealthStore()

  const [tab, setTab] = useState<Tab>('temp')

  // Drawer: температура
  const [tempDrawer, setTempDrawer] = useState(false)
  const [tempVal, setTempVal] = useState('')
  const [tempNotes, setTempNotes] = useState('')

  // Drawer: медикамент (разовый)
  const [medDrawer, setMedDrawer] = useState(false)
  const [medName, setMedName] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medNotes, setMedNotes] = useState('')

  // Drawer: расписание лекарства
  const [schedDrawer, setSchedDrawer] = useState(false)
  const [schedName, setSchedName] = useState('')
  const [schedDose, setSchedDose] = useState('')
  const [schedTimes, setSchedTimes] = useState<string[]>(['09:00'])

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayDoses = getTodayDoses(todayStr)

  // Drawer: прививка (кастомная)
  const [vaccDrawer, setVaccDrawer] = useState(false)
  const [vaccName, setVaccName] = useState('')
  const [vaccDate, setVaccDate] = useState('')

  // ── Handlers ────────────────────────────────────────────

  function handleAddTemp() {
    const val = parseFloat(tempVal.replace(',', '.'))
    if (!tempVal || isNaN(val) || val < 34 || val > 42) {
      toast.error('Введите корректную температуру (34–42°C)')
      return
    }
    addTemp(val, tempNotes || undefined)
    setTempVal('')
    setTempNotes('')
    setTempDrawer(false)
    toast.success('Температура записана')
  }

  function handleAddScheduled() {
    if (!schedName.trim() || !schedDose.trim() || schedTimes.length === 0) {
      toast.error('Заполните название, дозу и время')
      return
    }
    addScheduledMed(schedName.trim(), schedDose.trim(), schedTimes)
    setSchedName('')
    setSchedDose('')
    setSchedTimes(['09:00'])
    setSchedDrawer(false)
    toast.success('Расписание добавлено')
  }

  function handleAddMed() {
    if (!medName.trim() || !medDose.trim()) {
      toast.error('Заполните название и дозу')
      return
    }
    addMedication(medName.trim(), medDose.trim(), medNotes || undefined)
    setMedName('')
    setMedDose('')
    setMedNotes('')
    setMedDrawer(false)
    toast.success('Медикамент записан')
  }

  function handleAddVaccine() {
    if (!vaccName.trim() || !vaccDate) {
      toast.error('Заполните название и дату')
      return
    }
    addVaccine(vaccName.trim(), new Date(vaccDate).toISOString())
    setVaccName('')
    setVaccDate('')
    setVaccDrawer(false)
    toast.success('Прививка добавлена')
  }

  // Сортировка вакцин: сначала не сделанные (по дате), потом сделанные
  const sortedVaccines = [...vaccines].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  })

  const doneCount = vaccines.filter((v) => v.done).length
  const latest = temps[0]

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
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Thermometer size={16} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Здоровье</h1>
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-5">
          {([
            { key: 'temp', label: 'Температура', Icon: Thermometer },
            { key: 'meds', label: 'Препараты', Icon: Pill },
            { key: 'vaccines', label: 'Прививки', Icon: Syringe },
          ] as { key: Tab; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-medium transition-colors ${
                tab === key
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── ТЕМПЕРАТУРА ─────────────────────────────────── */}
          {tab === 'temp' && (
            <motion.div
              key="temp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Последняя температура */}
              {latest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`${tempBg(latest.temperature)} rounded-2xl p-4 mb-4 flex items-center gap-4`}
                >
                  <Thermometer size={28} className={tempColor(latest.temperature)} />
                  <div>
                    <p className={`text-3xl font-bold ${tempColor(latest.temperature)}`}>
                      {latest.temperature.toFixed(1)}°C
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tempLabel(latest.temperature)} · {formatDateTime(latest.time)}
                    </p>
                    {latest.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{latest.notes}</p>
                    )}
                  </div>
                </motion.div>
              )}

              <Button fullWidth onClick={() => setTempDrawer(true)} className="mb-4">
                + Записать температуру
              </Button>

              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                История ({temps.length})
              </p>
              {temps.length === 0 ? (
                <p className="text-center text-gray-300 dark:text-gray-600 text-sm py-8">Нет записей</p>
              ) : (
                <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
                  {temps.map((r) => (
                    <motion.div
                      key={r.id}
                      variants={itemVariants}
                      className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3"
                    >
                      <div className={`w-9 h-9 rounded-full ${tempBg(r.temperature)} flex items-center justify-center shrink-0`}>
                        <Thermometer size={16} className={tempColor(r.temperature)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${tempColor(r.temperature)}`}>
                          {r.temperature.toFixed(1)}°C
                          <span className="text-xs font-normal text-gray-400 ml-2">{tempLabel(r.temperature)}</span>
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(r.time)}</p>
                        {r.notes && <p className="text-xs text-gray-400 truncate">{r.notes}</p>}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => { deleteTemp(r.id); toast.error('Удалено') }}
                        className="text-gray-300 hover:text-red-400 p-1"
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── МЕДИКАМЕНТЫ ──────────────────────────────────── */}
          {tab === 'meds' && (
            <motion.div
              key="meds"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Расписание сегодня */}
              {scheduledMeds.filter((m) => m.active).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                    Расписание сегодня
                  </p>
                  <div className="space-y-2">
                    {todayDoses.map(({ med, time, log }) => (
                      <div
                        key={`${med.id}-${time}`}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${
                          log?.taken
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/40'
                            : log?.taken === false
                            ? 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60'
                            : 'bg-white dark:bg-gray-800 border-purple-100 dark:border-gray-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <Pill size={14} className="text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">
                            {med.name} · {med.dose}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {time}
                          </p>
                        </div>
                        {log?.taken ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ принято</span>
                        ) : log?.taken === false ? (
                          <span className="text-xs text-gray-400">пропущено</span>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => { logDose(med.id, todayStr, time); toast.success('Принято') }}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                            >
                              Принято
                            </button>
                            <button
                              onClick={() => { skipDose(med.id, todayStr, time); toast('Пропущено') }}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                            >
                              Пропуск
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Активные назначения */}
              {scheduledMeds.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                    Назначения
                  </p>
                  <div className="space-y-2">
                    {scheduledMeds.map((med) => (
                      <div key={med.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2.5 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{med.name}</p>
                          <p className="text-xs text-gray-400">{med.dose} · {med.times.join(', ')}</p>
                        </div>
                        <button onClick={() => toggleScheduledMed(med.id)} className="p-1 text-gray-400">
                          {med.active
                            ? <ToggleRight size={20} className="text-purple-500" />
                            : <ToggleLeft size={20} className="text-gray-300" />
                          }
                        </button>
                        <button onClick={() => { removeScheduledMed(med.id); toast('Назначение удалено') }} className="p-1 text-gray-300 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSchedDrawer(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-purple-200 dark:border-gray-600 text-sm font-medium text-purple-500 dark:text-purple-400 active:scale-95 transition-transform"
                >
                  <CalendarClock size={15} />
                  + Расписание
                </button>
                <button
                  onClick={() => setMedDrawer(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 active:scale-95 transition-transform"
                >
                  <Plus size={15} />
                  + Разово
                </button>
              </div>

              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                История ({medications.length})
              </p>
              {medications.length === 0 ? (
                <p className="text-center text-gray-300 dark:text-gray-600 text-sm py-4">Нет записей</p>
              ) : (
                <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
                  {medications.map((r) => (
                    <motion.div
                      key={r.id}
                      variants={itemVariants}
                      className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        <Pill size={16} className="text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {r.name}
                          <span className="text-xs text-gray-400 ml-2">{r.dose}</span>
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(r.time)}</p>
                        {r.notes && <p className="text-xs text-gray-400 truncate">{r.notes}</p>}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => { deleteMedication(r.id); toast.error('Удалено') }}
                        className="text-gray-300 hover:text-red-400 p-1"
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── ПРИВИВКИ ─────────────────────────────────────── */}
          {tab === 'vaccines' && (
            <motion.div
              key="vaccines"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Прогресс */}
              <Card className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Выполнено</p>
                  <p className="text-sm font-bold text-emerald-600">{doneCount} / {vaccines.length}</p>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vaccines.length ? (doneCount / vaccines.length) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </Card>

              <Button
                fullWidth
                onClick={() => setVaccDrawer(true)}
                className="mb-4"
              >
                <Plus size={16} className="inline mr-1" />
                Добавить прививку
              </Button>

              <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
                {sortedVaccines.map((v) => {
                  const isOverdue = !v.done && new Date(v.scheduledDate) < new Date()
                  return (
                    <motion.div
                      key={v.id}
                      variants={itemVariants}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-3 border flex items-center gap-3 ${
                        v.done ? 'border-emerald-100 dark:border-emerald-900 opacity-70' : isOverdue ? 'border-red-200' : 'border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => v.done ? markVaccineUndone(v.id) : markVaccineDone(v.id)}
                        className={v.done ? 'text-emerald-500' : 'text-gray-300'}
                      >
                        {v.done
                          ? <CheckCircle2 size={22} />
                          : <Circle size={22} className={isOverdue ? 'text-red-400' : ''} />
                        }
                      </motion.button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${v.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                          {v.name}
                        </p>
                        <p className={`text-xs mt-0.5 ${isOverdue && !v.done ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                          {v.done
                            ? `Сделано ${v.doneDate ? formatDate(v.doneDate) : ''}`
                            : `Плановая дата: ${formatDate(v.scheduledDate)}`
                          }
                          {isOverdue && !v.done && ' · просрочена'}
                        </p>
                        {v.notes && <p className="text-xs text-gray-400 truncate">{v.notes}</p>}
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => { deleteVaccine(v.id); toast.error('Удалено') }}
                        className="text-gray-200 hover:text-red-400 p-1"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Drawer: температура */}
      <Drawer open={tempDrawer} onClose={() => setTempDrawer(false)} title="Записать температуру">
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Температура (°C)</label>
            <input
              type="number"
              step="0.1"
              value={tempVal}
              onChange={(e) => setTempVal(e.target.value)}
              placeholder="например: 36.6"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Заметка (необязательно)</label>
            <input
              type="text"
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="например: после купания"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          {tempVal && !isNaN(parseFloat(tempVal)) && (
            <div className={`${tempBg(parseFloat(tempVal))} rounded-xl p-3 text-center`}>
              <p className={`text-lg font-bold ${tempColor(parseFloat(tempVal))}`}>
                {parseFloat(tempVal).toFixed(1)}°C — {tempLabel(parseFloat(tempVal))}
              </p>
            </div>
          )}
          <Button fullWidth size="lg" onClick={handleAddTemp} disabled={!tempVal}>
            Сохранить
          </Button>
        </div>
      </Drawer>

      {/* Drawer: медикамент */}
      <Drawer open={medDrawer} onClose={() => setMedDrawer(false)} title="Добавить препарат">
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Название</label>
            <input
              type="text"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="например: Нурофен, Виферон..."
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Доза</label>
            <input
              type="text"
              value={medDose}
              onChange={(e) => setMedDose(e.target.value)}
              placeholder="например: 2.5 мл"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Заметка (необязательно)</label>
            <input
              type="text"
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
              placeholder="например: при температуре выше 38"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <Button fullWidth size="lg" onClick={handleAddMed} disabled={!medName || !medDose}>
            Сохранить
          </Button>
        </div>
      </Drawer>

      {/* Drawer: расписание лекарства */}
      <Drawer open={schedDrawer} onClose={() => setSchedDrawer(false)} title="Расписание приёма">
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Название</label>
            <input
              type="text"
              value={schedName}
              onChange={(e) => setSchedName(e.target.value)}
              placeholder="например: Витамин D"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Доза</label>
            <input
              type="text"
              value={schedDose}
              onChange={(e) => setSchedDose(e.target.value)}
              placeholder="например: 1 капля"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Время приёма</label>
            <div className="space-y-2">
              {schedTimes.map((t, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => {
                      const updated = [...schedTimes]
                      updated[i] = e.target.value
                      setSchedTimes(updated)
                    }}
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                  {schedTimes.length > 1 && (
                    <button
                      onClick={() => setSchedTimes(schedTimes.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-400"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              ))}
              {schedTimes.length < 4 && (
                <button
                  onClick={() => setSchedTimes([...schedTimes, '12:00'])}
                  className="text-xs text-purple-500 font-medium flex items-center gap-1"
                >
                  <Plus size={12} /> Добавить время
                </button>
              )}
            </div>
          </div>
          <Button fullWidth size="lg" onClick={handleAddScheduled} disabled={!schedName || !schedDose}>
            Сохранить расписание
          </Button>
        </div>
      </Drawer>

      {/* Drawer: добавить прививку */}
      <Drawer open={vaccDrawer} onClose={() => setVaccDrawer(false)} title="Добавить прививку">
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Название</label>
            <input
              type="text"
              value={vaccName}
              onChange={(e) => setVaccName(e.target.value)}
              placeholder="например: Менингококк"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Плановая дата</label>
            <input
              type="date"
              value={vaccDate}
              onChange={(e) => setVaccDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <Button fullWidth size="lg" onClick={handleAddVaccine} disabled={!vaccName || !vaccDate}>
            Добавить
          </Button>
        </div>
      </Drawer>
    </>
  )
}
