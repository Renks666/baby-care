import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export interface DayNote {
  id: string
  date: string      // YYYY-MM-DD
  text: string
  createdAt: string // ISO
}

interface NotesState {
  notes: DayNote[]
  addNote: (text: string, date?: string) => void
  updateNote: (id: string, text: string) => void
  deleteNote: (id: string) => void
  getByDate: (date: string) => DayNote[]
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (text, date) => {
        const d = date ?? new Date().toISOString().slice(0, 10)
        set((s) => ({
          notes: [{ id: uuid(), date: d, text, createdAt: new Date().toISOString() }, ...s.notes],
        }))
      },

      updateNote: (id, text) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, text } : n)),
        })),

      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      getByDate: (date) => get().notes.filter((n) => n.date === date),
    }),
    { name: 'babycare-notes' }
  )
)
