import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { FeedingRecord, FeedingType, BreastSide } from '../types'

interface FeedingState {
  records: FeedingRecord[]
  activeFeeding: FeedingRecord | null
  startFeeding: (type: FeedingType, side?: BreastSide, startTime?: string) => void
  stopFeeding: (amount?: number, notes?: string) => void
  pauseFeeding: () => void
  resumeFeeding: () => void
  addRecord: (record: Omit<FeedingRecord, 'id'>) => void
  updateRecord: (id: string, patch: Partial<Omit<FeedingRecord, 'id' | 'childId'>>) => void
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
        // если на паузе — сначала накапливаем текущую паузу
        const pausedMs = active.pausedAt
          ? (active.pausedMs ?? 0) + (Date.now() - new Date(active.pausedAt).getTime())
          : (active.pausedMs ?? 0)
        const completed: FeedingRecord = {
          ...active,
          endTime: new Date().toISOString(),
          amount,
          notes,
          pausedMs: pausedMs || undefined,
          pausedAt: undefined,
        }
        set((s) => ({ records: [completed, ...s.records], activeFeeding: null }))
      },

      pauseFeeding: () => {
        const active = get().activeFeeding
        if (!active || active.pausedAt) return
        set({ activeFeeding: { ...active, pausedAt: new Date().toISOString() } })
      },

      resumeFeeding: () => {
        const active = get().activeFeeding
        if (!active || !active.pausedAt) return
        const addedMs = Date.now() - new Date(active.pausedAt).getTime()
        set({
          activeFeeding: {
            ...active,
            pausedMs: (active.pausedMs ?? 0) + addedMs,
            pausedAt: undefined,
          },
        })
      },

      addRecord: (record) => {
        set((s) => ({ records: [{ ...record, id: uuid() }, ...s.records] }))
      },

      updateRecord: (id, patch) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

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
