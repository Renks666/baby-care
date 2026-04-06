import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ChevronLeft, Thermometer, Pill, Syringe,
  Trash2, CheckCircle2, Circle, Plus,
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
    addTemp, deleteTemp,
    addMedication, deleteMedication,
    markVaccineDone, markVaccineUndone, addVaccine, deleteVaccine,
  } = useHealthStore()

  const [tab, setTab] = useState<Tab>('temp')

  // Drawer: температура
  const [tempDrawer, setTempDrawer] = useState(false)
  const [tempVal, setTempVal] = useState('')
  const [tempNotes, setTempNotes] = useState('')

  // Drawer: медикамент
  const [medDrawer, setMedDrawer] = useState(false)
  const [medName, setMedName] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medNotes, setMedNotes] = useState('')

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
            <h1 className="text-xl font-bold text-gray-800">Здоровье</h1>
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
                  : 'bg-gray-100 text-gray-500'
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

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                История ({temps.length})
              </p>
              {temps.length === 0 ? (
                <p className="text-center text-gray-300 text-sm py-8">Нет записей</p>
              ) : (
                <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
                  {temps.map((r) => (
                    <motion.div
                      key={r.id}
                      variants={itemVariants}
                      className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3"
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
              <Button fullWidth onClick={() => setMedDrawer(true)} className="mb-4">
                + Добавить препарат
              </Button>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                История ({medications.length})
              </p>
              {medications.length === 0 ? (
                <p className="text-center text-gray-300 text-sm py-8">Нет записей</p>
              ) : (
                <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-2">
                  {medications.map((r) => (
                    <motion.div
                      key={r.id}
                      variants={itemVariants}
                      className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        <Pill size={16} className="text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">
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
                  <p className="text-sm font-semibold text-gray-700">Выполнено</p>
                  <p className="text-sm font-bold text-emerald-600">{doneCount} / {vaccines.length}</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                      className={`bg-white rounded-xl p-3 border flex items-center gap-3 ${
                        v.done ? 'border-emerald-100 opacity-70' : isOverdue ? 'border-red-200' : 'border-gray-100'
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
                        <p className={`text-sm font-medium ${v.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Заметка (необязательно)</label>
            <input
              type="text"
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="например: после купания"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Доза</label>
            <input
              type="text"
              value={medDose}
              onChange={(e) => setMedDose(e.target.value)}
              placeholder="например: 2.5 мл"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Заметка (необязательно)</label>
            <input
              type="text"
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
              placeholder="например: при температуре выше 38"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <Button fullWidth size="lg" onClick={handleAddMed} disabled={!medName || !medDose}>
            Сохранить
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Плановая дата</label>
            <input
              type="date"
              value={vaccDate}
              onChange={(e) => setVaccDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
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
