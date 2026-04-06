import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Child } from '../types'

interface ChildState {
  child: Child
  setChild: (child: Child) => void
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      child: {
        id: 'nicole-001',
        name: 'Николь',
        birthDate: '2026-03-29',
        gender: 'female',
      },
      setChild: (child) => set({ child }),
    }),
    { name: 'babycare-child' }
  )
)
