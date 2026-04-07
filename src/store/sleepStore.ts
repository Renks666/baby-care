import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { SleepRecord, SleepType } from '../types'

interface SleepState {
  records: SleepRecord[]
  activeSleep: SleepRecord | null
  startSleep: (type?: SleepType, startTime?: string) => void
  stopSleep: (quality?: number, notes?: string) => void
  addRecord: (record: Omit<SleepRecord, 'id'>) => void
  deleteRecord: (id: string) => void
  getToday: () => SleepRecord[]
}

function detectSleepType(): SleepType {
  const hour = new Date().getHours()
  return hour >= 20 || hour < 7 ? 'night' : 'nap'
}

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      records: [],
      activeSleep: null,

      startSleep: (type, startTime) => {
        const record: SleepRecord = {
          id: uuid(),
          childId: 'nicole-001',
          type: type ?? detectSleepType(),
          startTime: startTime ?? new Date().toISOString(),
        }
        set({ activeSleep: record })
      },

      stopSleep: (quality, notes) => {
        const active = get().activeSleep
        if (!active) return
        const completed: SleepRecord = {
          ...active,
          endTime: new Date().toISOString(),
          quality,
          notes,
        }
        set((s) => ({ records: [completed, ...s.records], activeSleep: null }))
      },

      addRecord: (record) => {
        set((s) => ({ records: [{ ...record, id: uuid() }, ...s.records] }))
      },

      deleteRecord: (id) => {
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }))
      },

      getToday: () => {
        const today = new Date().toDateString()
        return get().records.filter((r) => new Date(r.startTime).toDateString() === today)
      },
    }),
    { name: 'babycare-sleep' }
  )
)
