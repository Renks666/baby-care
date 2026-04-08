import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { GrowthRecord } from '../types'

interface GrowthState {
  records: GrowthRecord[]
  addRecord: (record: Omit<GrowthRecord, 'id' | 'childId'>) => void
  updateRecord: (id: string, patch: Partial<Omit<GrowthRecord, 'id' | 'childId'>>) => void
  deleteRecord: (id: string) => void
  getLatest: () => GrowthRecord | null
}

export const useGrowthStore = create<GrowthState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) => {
        const full: GrowthRecord = {
          ...record,
          id: uuid(),
          childId: 'nicole-001',
        }
        set((s) => ({
          records: [full, ...s.records].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ),
        }))
      },

      updateRecord: (id, patch) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRecord: (id) => {
        set((s) => ({ records: s.records.filter((r) => r.id !== id) }))
      },

      getLatest: () => {
        const records = get().records
        return records.length > 0 ? records[0] : null
      },
    }),
    { name: 'babycare-growth' }
  )
)
