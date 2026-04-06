import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Baby, Sparkles } from 'lucide-react'
import { useChildStore } from '../store/childStore'
import { useGrowthStore } from '../store/growthStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Drawer } from '../components/common/Drawer'
import { formatAge, formatDate } from '../utils/formatTime'
import { pageVariants } from '../utils/animations'

export function Profile() {
  const { child, setChild } = useChildStore()
  const { records: growthRecords } = useGrowthStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [name, setName] = useState(child.name)
  const [birthDate, setBirthDate] = useState(child.birthDate)
  const [birthWeight, setBirthWeight] = useState(child.birthWeight ? String(child.birthWeight / 1000) : '')
  const [birthHeight, setBirthHeight] = useState(child.birthHeight ? String(child.birthHeight) : '')

  function handleSave() {
    setChild({
      ...child,
      name,
      birthDate,
      birthWeight: birthWeight ? parseFloat(birthWeight) * 1000 : undefined,
      birthHeight: birthHeight ? parseFloat(birthHeight) : undefined,
    })
    setDrawerOpen(false)
    toast.success('Профиль сохранён')
  }

  const latestGrowth = growthRecords[0]

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="px-4 pb-24"
      >
        <div className="pt-12 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
              <Baby size={16} className="text-pink-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Профиль</h1>
          </div>
        </div>

        {/* Аватар */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-3 cursor-default"
          >
            <Baby size={40} className="text-pink-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800">{child.name}</h2>
          <p className="text-sm text-pink-500 font-medium mt-1">{formatAge(child.birthDate)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Родилась{' '}
            {new Date(child.birthDate).toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* Последние измерения */}
        {latestGrowth && (
          <Card className="mb-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
              Последние измерения · {formatDate(latestGrowth.date)}
            </p>
            <div className="flex gap-6">
              {latestGrowth.weight && (
                <div>
                  <p className="text-lg font-bold text-gray-800">{(latestGrowth.weight / 1000).toFixed(2)} кг</p>
                  <p className="text-xs text-gray-400">вес</p>
                </div>
              )}
              {latestGrowth.height && (
                <div>
                  <p className="text-lg font-bold text-gray-800">{latestGrowth.height} см</p>
                  <p className="text-xs text-gray-400">рост</p>
                </div>
              )}
              {latestGrowth.headCirc && (
                <div>
                  <p className="text-lg font-bold text-gray-800">{latestGrowth.headCirc} см</p>
                  <p className="text-xs text-gray-400">голова</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Данные */}
        <Card className="mb-4">
          <div className="space-y-3">
            <InfoRow label="Имя" value={child.name} />
            <InfoRow
              label="Дата рождения"
              value={new Date(child.birthDate).toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            />
            {child.birthWeight && (
              <InfoRow label="Вес при рождении" value={`${(child.birthWeight / 1000).toFixed(2)} кг`} />
            )}
            {child.birthHeight && (
              <InfoRow label="Рост при рождении" value={`${child.birthHeight} см`} />
            )}
          </div>
          <Button variant="secondary" fullWidth onClick={() => setDrawerOpen(true)} className="mt-4">
            Редактировать
          </Button>
        </Card>

        <div className="text-center text-xs text-gray-300 mt-8">
          <p className="flex items-center justify-center gap-1"><Sparkles size={12} className="text-pink-300" /> BabyCare v1.0</p>
          <p className="mt-1">Все данные хранятся локально на устройстве</p>
        </div>
      </motion.div>

      {/* Drawer: редактирование */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Редактировать профиль">
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Дата рождения</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Вес при рождении (кг)</label>
            <input
              type="number"
              step="0.01"
              value={birthWeight}
              onChange={(e) => setBirthWeight(e.target.value)}
              placeholder="например: 3.35"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Рост при рождении (см)</label>
            <input
              type="number"
              step="0.1"
              value={birthHeight}
              onChange={(e) => setBirthHeight(e.target.value)}
              placeholder="например: 50"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
          <Button fullWidth size="lg" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </Drawer>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  )
}
