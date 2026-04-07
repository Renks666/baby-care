import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { FeedingRecord, FeedingType, BreastSide } from '../types'

interface FeedingState {
  records: FeedingRecord[]
  activeFeeding: FeedingRecord | null
  startFeeding: (type: FeedingType, side?: BreastSide, startTime?: string) => void
  stopFeeding: (amount?: number, notes?: string) => void
  addRecord: (record: Omit<FeedingRecord, 'id'>) => void
  deleteRecord: (id: string) => void
  getToday: () => FeedingRecord[]
}

export const useFeedingStore = create<FeedingState>()(
  persist(
    (set, get) => ({
      records: [],
      activeFeeding: null,

      startFeeding: (type, side, startTime) => {
        const record: FeedingRecord = {
          id: uuid(),
          childId: 'nicole-001',
          type,
          startTime: startTime ?? new Date().toISOString(),
          side,
        }
        set({ activeFeeding: record })
      },

      stopFeeding: (amount, notes) => {
        const active = get().activeFeeding
        if (!active) return
        const completed: FeedingRecord = {
          ...active,
          endTime: new Date().toISOString(),
          amount,
          notes,
        }
        set((s) => ({ records: [completed, ...s.records], activeFeeding: null }))
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
    { name: 'babycare-feeding' }
  )
)
