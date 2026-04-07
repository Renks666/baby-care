import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import { addDays, addMonths } from 'date-fns'
import type { TempRecord, MedicationRecord, VaccineRecord } from '../types'

export interface ScheduledMed {
  id: string
  name: string
  dose: string
  times: string[]   // HH:MM список, например ['09:00', '21:00']
  active: boolean
  startDate: string // YYYY-MM-DD
}

export interface DoseLog {
  id: string
  medId: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM
  taken: boolean
}

// Стандартный календарь прививок РФ для Николь (рождена 29.03.2026)
const BIRTH = new Date('2026-03-29')

function makeVaccine(name: string, date: Date): VaccineRecord {
  return {
    id: uuid(),
    childId: 'nicole-001',
    name,
    scheduledDate: date.toISOString(),
    done: false,
  }
}

const DEFAULT_VACCINES: VaccineRecord[] = [
  makeVaccine('Гепатит B (1-я доза)', addDays(BIRTH, 1)),
  makeVaccine('БЦЖ (туберкулёз)', addDays(BIRTH, 3)),
  makeVaccine('Гепатит B (2-я доза)', addMonths(BIRTH, 1)),
  makeVaccine('Пневмококк (1-я доза)', addMonths(BIRTH, 2)),
  makeVaccine('Ротавирус (1-я доза)', addMonths(BIRTH, 2)),
  makeVaccine('АКДС (1-я доза)', addMonths(BIRTH, 3)),
  makeVaccine('Полиомиелит (1-я доза)', addMonths(BIRTH, 3)),
  makeVaccine('Гемофильная инфекция (1-я доза)', addMonths(BIRTH, 3)),
  makeVaccine('Пневмококк (2-я доза)', addMonths(BIRTH, 3)),
  makeVaccine('Ротавирус (2-я доза)', addMonths(BIRTH, 3)),
  makeVaccine('АКДС (2-я доза)', addMonths(BIRTH, 4.5)),
  makeVaccine('Полиомиелит (2-я доза)', addMonths(BIRTH, 4.5)),
  makeVaccine('Гемофильная инфекция (2-я доза)', addMonths(BIRTH, 4.5)),
  makeVaccine('Ротавирус (3-я доза)', addMonths(BIRTH, 4.5)),
  makeVaccine('АКДС (3-я доза)', addMonths(BIRTH, 6)),
  makeVaccine('Полиомиелит (3-я доза)', addMonths(BIRTH, 6)),
  makeVaccine('Гемофильная инфекция (3-я доза)', addMonths(BIRTH, 6)),
  makeVaccine('Гепатит B (3-я доза)', addMonths(BIRTH, 6)),
  makeVaccine('Корь, краснуха, паротит', addMonths(BIRTH, 12)),
  makeVaccine('Пневмококк (ревакцинация)', addMonths(BIRTH, 12)),
  makeVaccine('Ветряная оспа', addMonths(BIRTH, 12)),
]

interface HealthState {
  temps: TempRecord[]
  medications: MedicationRecord[]
  vaccines: VaccineRecord[]
  scheduledMeds: ScheduledMed[]
  doseLogs: DoseLog[]

  addTemp: (temp: number, notes?: string) => void
  deleteTemp: (id: string) => void

  addMedication: (name: string, dose: string, notes?: string) => void
  deleteMedication: (id: string) => void

  markVaccineDone: (id: string, doneDate?: string) => void
  markVaccineUndone: (id: string) => void
  addVaccine: (name: string, scheduledDate: string) => void
  deleteVaccine: (id: string) => void

  addScheduledMed: (name: string, dose: string, times: string[]) => void
  removeScheduledMed: (id: string) => void
  toggleScheduledMed: (id: string) => void
  logDose: (medId: string, date: string, time: string) => void
  skipDose: (medId: string, date: string, time: string) => void
  getTodayDoses: (date: string) => Array<{ med: ScheduledMed; time: string; log?: DoseLog }>
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      temps: [],
      medications: [],
      vaccines: DEFAULT_VACCINES,
      scheduledMeds: [],
      doseLogs: [],

      addTemp: (temperature, notes) => {
        const record: TempRecord = {
          id: uuid(),
          childId: 'nicole-001',
          time: new Date().toISOString(),
          temperature,
          notes,
        }
        set((s) => ({ temps: [record, ...s.temps] }))
      },

      deleteTemp: (id) => {
        set((s) => ({ temps: s.temps.filter((r) => r.id !== id) }))
      },

      addMedication: (name, dose, notes) => {
        const record: MedicationRecord = {
          id: uuid(),
          childId: 'nicole-001',
          time: new Date().toISOString(),
          name,
          dose,
          notes,
        }
        set((s) => ({ medications: [record, ...s.medications] }))
      },

      deleteMedication: (id) => {
        set((s) => ({ medications: s.medications.filter((r) => r.id !== id) }))
      },

      markVaccineDone: (id, doneDate) => {
        set((s) => ({
          vaccines: s.vaccines.map((v) =>
            v.id === id ? { ...v, done: true, doneDate: doneDate ?? new Date().toISOString() } : v
          ),
        }))
      },

      markVaccineUndone: (id) => {
        set((s) => ({
          vaccines: s.vaccines.map((v) =>
            v.id === id ? { ...v, done: false, doneDate: undefined } : v
          ),
        }))
      },

      addVaccine: (name, scheduledDate) => {
        const record: VaccineRecord = {
          id: uuid(),
          childId: 'nicole-001',
          name,
          scheduledDate,
          done: false,
        }
        set((s) => ({
          vaccines: [...s.vaccines, record].sort(
            (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
          ),
        }))
      },

      deleteVaccine: (id) => {
        set((s) => ({ vaccines: s.vaccines.filter((v) => v.id !== id) }))
      },

      addScheduledMed: (name, dose, times) => {
        const med: ScheduledMed = {
          id: uuid(),
          name,
          dose,
          times,
          active: true,
          startDate: new Date().toISOString().slice(0, 10),
        }
        set((s) => ({ scheduledMeds: [...s.scheduledMeds, med] }))
      },

      removeScheduledMed: (id) =>
        set((s) => ({
          scheduledMeds: s.scheduledMeds.filter((m) => m.id !== id),
          doseLogs: s.doseLogs.filter((l) => l.medId !== id),
        })),

      toggleScheduledMed: (id) =>
        set((s) => ({
          scheduledMeds: s.scheduledMeds.map((m) =>
            m.id === id ? { ...m, active: !m.active } : m
          ),
        })),

      logDose: (medId, date, time) =>
        set((s) => {
          const existing = s.doseLogs.find(
            (l) => l.medId === medId && l.date === date && l.time === time
          )
          if (existing) {
            return { doseLogs: s.doseLogs.map((l) =>
              l.medId === medId && l.date === date && l.time === time
                ? { ...l, taken: true }
                : l
            )}
          }
          return {
            doseLogs: [...s.doseLogs, { id: uuid(), medId, date, time, taken: true }],
          }
        }),

      skipDose: (medId, date, time) =>
        set((s) => {
          const existing = s.doseLogs.find(
            (l) => l.medId === medId && l.date === date && l.time === time
          )
          if (existing) {
            return { doseLogs: s.doseLogs.map((l) =>
              l.medId === medId && l.date === date && l.time === time
                ? { ...l, taken: false }
                : l
            )}
          }
          return {
            doseLogs: [...s.doseLogs, { id: uuid(), medId, date, time, taken: false }],
          }
        }),

      getTodayDoses: (date) => {
        const { scheduledMeds, doseLogs } = get()
        const result: Array<{ med: ScheduledMed; time: string; log?: DoseLog }> = []
        for (const med of scheduledMeds) {
          if (!med.active) continue
          for (const time of med.times) {
            const log = doseLogs.find(
              (l) => l.medId === med.id && l.date === date && l.time === time
            )
            result.push({ med, time, log })
          }
        }
        return result.sort((a, b) => a.time.localeCompare(b.time))
      },
    }),
    { name: 'babycare-health' }
  )
)
