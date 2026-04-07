import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { DiaperRecord, DiaperType } from '../types'

interface DiaperState {
  records: DiaperRecord[]
  addRecord: (type: DiaperType, notes?: string, time?: string) => void
  deleteRecord: (id: string) => void
  getToday: () => DiaperRecord[]
}

export const useDiaperStore = create<DiaperState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (type, notes, time) => {
        const record: DiaperRecord = {
          id: uuid(),
          childId: 'nicole-001',
          time: time ?? new Date().toISOString(),
          type,
          notes,
        }
        set((s) => ({ records: [record, ...s.records] }))
      },

      deleteRecord: (id) => {
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }))
      },

      getToday: () => {
        const today = new Date().toDateString()
        return get().records.filter((r) => new Date(r.time).toDateString() === today)
      },
    }),
    { name: 'babycare-diaper' }
  )
)
