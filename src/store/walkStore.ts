import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { WalkRecord } from '../types'

interface WalkState {
  records: WalkRecord[]
  activeWalk: WalkRecord | null
  startWalk: (startTime?: string) => void
  stopWalk: (notes?: string) => void
  addRecord: (record: Omit<WalkRecord, 'id'>) => void
  updateRecord: (id: string, patch: Partial<Omit<WalkRecord, 'id' | 'childId'>>) => void
  deleteRecord: (id: string) => void
  getToday: () => WalkRecord[]
}

export const useWalkStore = create<WalkState>()(
  persist(
    (set, get) => ({
      records: [],
      activeWalk: null,

      startWalk: (startTime) => {
        const record: WalkRecord = {
          id: uuid(),
          childId: 'nicole-001',
          startTime: startTime ?? new Date().toISOString(),
        }
        set({ activeWalk: record })
      },

      stopWalk: (notes) => {
        const active = get().activeWalk
        if (!active) return
        const completed: WalkRecord = {
          ...active,
          endTime: new Date().toISOString(),
          notes: notes || undefined,
        }
        set((s) => ({
          activeWalk: null,
          records: [completed, ...s.records],
        }))
      },

      addRecord: (record) =>
        set((s) => ({
          records: [{ ...record, id: uuid() }, ...s.records],
        })),

      updateRecord: (id, patch) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRecord: (id) =>
        set((s) => ({ records: s.records.filter((r) => r.id !== id) })),

      getToday: () => {
        const today = new Date().toDateString()
        return get().records.filter((r) => new Date(r.startTime).toDateString() === today)
      },
    }),
    { name: 'babycare-walk' }
  )
)
