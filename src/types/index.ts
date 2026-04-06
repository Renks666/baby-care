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
}

// ── Подгузники ──────────────────────────────────────────
export type DiaperType = 'wet' | 'dirty' | 'mixed' | 'dry'

export interface DiaperRecord {
  id: string
  childId: string
  time: string
  type: DiaperType
  notes?: string
}

// ── Рост и вес ──────────────────────────────────────────
export interface GrowthRecord {
  id: string
  childId: string
  date: string
  weight?: number   // граммы
  height?: number   // см
  headCirc?: number // см
}

// ── Прогулки ─────────────────────────────────────────────
export interface WalkRecord {
  id: string
  childId: string
  startTime: string
  endTime?: string
  notes?: string
}

// ── Здоровье (температура) ───────────────────────────────
export interface HealthRecord {
  id: string
  childId: string
  time: string
  temperature?: number // °C
  notes?: string
}

// ── Активный таймер ─────────────────────────────────────
export interface ActiveTimer {
  type: 'feeding' | 'sleep' | 'walk'
  startTime: string
  meta?: Record<string, unknown>
}
