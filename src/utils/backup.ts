const STORAGE_KEYS = [
  'babycare-feeding',
  'babycare-sleep',
  'babycare-diaper',
  'babycare-growth',
  'babycare-health',
  'babycare-child',
  'milestones-store',
  'babycare-notes',
  'babycare-tummy',
  'babycare-theme',
]

export function exportBackup() {
  const data: Record<string, unknown> = {}
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        data[key] = JSON.parse(raw)
      } catch {
        data[key] = raw
      }
    }
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `babycare-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const payload = JSON.parse(text)

        if (!payload.version || !payload.data) {
          reject(new Error('Неверный формат файла'))
          return
        }

        for (const [key, value] of Object.entries(payload.data)) {
          localStorage.setItem(key, JSON.stringify(value))
        }

        resolve()
      } catch {
        reject(new Error('Не удалось прочитать файл'))
      }
    }
    reader.onerror = () => reject(new Error('Ошибка чтения файла'))
    reader.readAsText(file)
  })
}
