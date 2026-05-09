// ── Ребёнок ─────────────────────────────────────────────
export interface Child {
  id: string
  name: string
  birthDate: string // ISO date string
  gender: 'female' | 'male'
  photoURI?: string
  birthWeight?: number // граммы
  birthHeight?: number // см
}

// ── Кормление ───────────────────────────────────────────
export type FeedingType = 'breast' | 'bottle' | 'pumped' | 'solid'
export type BreastSide = 'left' | 'right' | 'both'

export interface FeedingRecord {
  id: string
  childId: string
  type: FeedingType
  startTime: string // ISO
  endTime?: string  // ISO
  side?: BreastSide
  amount?: number   // мл
  notes?: string
  pausedAt?: string // ISO — момент начала текущей паузы
  pausedMs?: number // суммарное время всех пауз в мс
}

// ── Сон ─────────────────────────────────────────────────
export type SleepType = 'nap' | 'night'

export interface SleepRecord {
  id: string
  childId: string
  startTime: string
  endTime?: string
  type: SleepType
  quality?: number // 1–5
  notes?: string
  pausedAt?: string // ISO — момент начала текущей паузы
  pausedMs?: number // суммарное время всех пауз в мс
}

// ── Рост и вес ──────────────────────────────────────────
export interface GrowthRecord {
  id: string
  childId: string
  date: string
  weight?: number   // граммы
  height?: number   // см
  headCirc?: number // см
  notes?: string
}

// ── Тумми-тайм ───────────────────────────────────────────
export interface TummyRecord {
  id: string
  childId: string
  startTime: string
  endTime?: string
  notes?: string
}

// ── Прогулки ─────────────────────────────────────────────
export interface WalkRecord {
  id: string
  childId: string
  startTime: string
  endTime?: string
  notes?: string
}

// ── Здоровье: температура ────────────────────────────────
export interface TempRecord {
  id: string
  childId: string
  time: string
  temperature: number // °C
  notes?: string
}

// ── Здоровье: медикаменты ────────────────────────────────
export interface MedicationRecord {
  id: string
  childId: string
  time: string
  name: string
  dose: string   // напр. "5 мл", "1/4 таб"
  notes?: string
}

// ── Здоровье: вакцины ────────────────────────────────────
export interface VaccineRecord {
  id: string
  childId: string
  name: string
  scheduledDate: string // ISO — плановая дата
  doneDate?: string     // ISO — дата выполнения
  done: boolean
  notes?: string
}

/** @deprecated use TempRecord */
export interface HealthRecord {
  id: string
  childId: string
  time: string
  temperature?: number
  notes?: string
}

// ── Активный таймер ─────────────────────────────────────
export interface ActiveTimer {
  type: 'feeding' | 'sleep' | 'walk'
  startTime: string
  meta?: Record<string, unknown>
}
