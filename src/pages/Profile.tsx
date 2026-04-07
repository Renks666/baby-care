import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Baby, Sparkles, Download, Upload, Camera } from 'lucide-react'
import { useChildStore } from '../store/childStore'
import { useGrowthStore } from '../store/growthStore'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Drawer } from '../components/common/Drawer'
import { formatAge, formatDate } from '../utils/formatTime'
import { pageVariants } from '../utils/animations'
import { exportBackup, importBackup } from '../utils/backup'

export function Profile() {
  const { child, setChild } = useChildStore()
  const { records: growthRecords } = useGrowthStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [name, setName] = useState(child.name)
  const [birthDate, setBirthDate] = useState(child.birthDate)
  const [birthWeight, setBirthWeight] = useState(child.birthWeight ? String(child.birthWeight / 1000) : '')
  const [birthHeight, setBirthHeight] = useState(child.birthHeight ? String(child.birthHeight) : '')
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(child.photoURI)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backupInputRef = useRef<HTMLInputElement>(null)

  function handleSave() {
    setChild({
      ...child,
      name,
      birthDate,
      birthWeight: birthWeight ? parseFloat(birthWeight) * 1000 : undefined,
      birthHeight: birthHeight ? parseFloat(birthHeight) : undefined,
      photoURI: photoPreview,
    })
    setDrawerOpen(false)
    toast.success('Профиль сохранён')
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPhotoPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleExport() {
    exportBackup()
    toast.success('Бэкап скачан')
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackup(file)
      toast.success('Данные восстановлены, перезагружаем...')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка импорта')
    }
    e.target.value = ''
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
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Профиль</h1>
          </div>
        </div>

        {/* Аватар */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-3 cursor-default overflow-hidden"
          >
            {child.photoURI
              ? <img src={child.photoURI} alt={child.name} className="w-full h-full object-cover" />
              : <Baby size={40} className="text-pink-400" />
            }
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{child.name}</h2>
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
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{(latestGrowth.weight / 1000).toFixed(2)} кг</p>
                  <p className="text-xs text-gray-400">вес</p>
                </div>
              )}
              {latestGrowth.height && (
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{latestGrowth.height} см</p>
                  <p className="text-xs text-gray-400">рост</p>
                </div>
              )}
              {latestGrowth.headCirc && (
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{latestGrowth.headCirc} см</p>
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

        {/* Бэкап */}
        <Card className="mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Данные</p>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-pink-200 dark:border-gray-600 text-sm font-medium text-pink-500 dark:text-pink-400 active:scale-95 transition-transform"
            >
              <Download size={15} />
              Скачать бэкап
            </button>
            <button
              onClick={() => backupInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 active:scale-95 transition-transform"
            >
              <Upload size={15} />
              Восстановить
            </button>
          </div>
          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
            Бэкап содержит все записи кормлений, сна, подгузников и других данных
          </p>
        </Card>

        <div className="text-center text-xs text-gray-300 mt-8">
          <p className="flex items-center justify-center gap-1"><Sparkles size={12} className="text-pink-300" /> BabyCare v1.0</p>
          <p className="mt-1">Все данные хранятся локально на устройстве</p>
        </div>
      </motion.div>

      {/* Drawer: редактирование */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Редактировать профиль">
        <div className="space-y-3 pb-2">
          {/* Фото */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30 overflow-hidden flex items-center justify-center">
              {photoPreview
                ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                : <Baby size={32} className="text-pink-400" />
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm text-pink-500 font-medium"
            >
              <Camera size={14} />
              {photoPreview ? 'Изменить фото' : 'Добавить фото'}
            </button>
            {photoPreview && (
              <button
                onClick={() => setPhotoPreview(undefined)}
                className="text-xs text-gray-400"
              >
                Удалить фото
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Дата рождения</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
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
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
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
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
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
    <div className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-700">
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{value}</span>
    </div>
  )
}
