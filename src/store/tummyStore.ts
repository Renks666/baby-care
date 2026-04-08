import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export interface TummyRecord {
  id: string
  childId: string
  startTime: string
  endTime?: string
  notes?: string
}

interface TummyState {
  records: TummyRecord[]
  activeTummy: TummyRecord | null
  startTummy: (startTime?: string) => void
  stopTummy: (notes?: string) => void
  addRecord: (record: Omit<TummyRecord, 'id'>) => void
  updateRecord: (id: string, patch: Partial<Omit<TummyRecord, 'id' | 'childId'>>) => void
  deleteRecord: (id: string) => void
  getToday: () => TummyRecord[]
}

export const useTummyStore = create<TummyState>()(
  persist(
    (set, get) => ({
      records: [],
      activeTummy: null,

      startTummy: (startTime) => {
        const record: TummyRecord = {
          id: uuid(),
          childId: 'nicole-001',
          startTime: startTime ?? new Date().toISOString(),
        }
        set({ activeTummy: record })
      },

      stopTummy: (notes) => {
        const active = get().activeTummy
        if (!active) return
        const completed: TummyRecord = {
          ...active,
          endTime: new Date().toISOString(),
          notes: notes || undefined,
        }
        set((s) => ({
          activeTummy: null,
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
    { name: 'babycare-tummy' }
  )
)
