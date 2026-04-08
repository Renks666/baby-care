import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export interface NoteFolder {
  id: string
  name: string
  createdAt: string
}

export interface DayNote {
  id: string
  date: string      // YYYY-MM-DD
  text: string
  createdAt: string // ISO
  folderId?: string
}

interface NotesState {
  notes: DayNote[]
  folders: NoteFolder[]
  addNote: (text: string, date?: string, folderId?: string) => void
  updateNote: (id: string, text: string, date?: string, folderId?: string) => void
  deleteNote: (id: string) => void
  getByDate: (date: string) => DayNote[]
  addFolder: (name: string) => void
  updateFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  getNotesByFolder: (folderId: string | null) => DayNote[]
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      folders: [],

      addNote: (text, date, folderId) => {
        const d = date ?? new Date().toISOString().slice(0, 10)
        set((s) => ({
          notes: [{ id: uuid(), date: d, text, createdAt: new Date().toISOString(), folderId }, ...s.notes],
        }))
      },

      updateNote: (id, text, date, folderId) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, text, ...(date !== undefined ? { date } : {}), ...(folderId !== undefined ? { folderId } : {}) }
              : n
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      getByDate: (date) => get().notes.filter((n) => n.date === date),

      addFolder: (name) =>
        set((s) => ({
          folders: [...s.folders, { id: uuid(), name, createdAt: new Date().toISOString() }],
        })),

      updateFolder: (id, name) =>
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),

      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: undefined } : n)),
        })),

      getNotesByFolder: (folderId) => {
        const notes = get().notes
        if (folderId === null) return notes.filter((n) => !n.folderId)
        return notes.filter((n) => n.folderId === folderId)
      },
    }),
    { name: 'babycare-notes' }
  )
)
