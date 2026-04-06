import { differenceInMinutes, differenceInHours, format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDuration(startISO: string, endISO?: string): string {
  const start = new Date(startISO)
  const end = endISO ? new Date(endISO) : new Date()
  const totalMinutes = differenceInMinutes(end, start)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} мин`
  if (minutes === 0) return `${hours} ч`
  return `${hours} ч ${minutes} мин`
}

export function formatTimeAgo(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: ru })
}

export function formatTime(isoString: string): string {
  return format(new Date(isoString), 'HH:mm')
}

export function formatDate(isoString: string): string {
  return format(new Date(isoString), 'd MMM', { locale: ru })
}

export function formatDateTime(isoString: string): string {
  return format(new Date(isoString), 'd MMM, HH:mm', { locale: ru })
}

export function getDurationMinutes(startISO: string, endISO?: string): number {
  const start = new Date(startISO)
  const end = endISO ? new Date(endISO) : new Date()
  return differenceInMinutes(end, start)
}

export function getHoursSince(isoString: string): number {
  return differenceInHours(new Date(), new Date(isoString))
}

/** Возраст ребёнка в неделях */
export function ageInWeeks(birthDate: string): number {
  return Math.floor(getDurationMinutes(birthDate) / (60 * 24 * 7))
}

/** Возраст ребёнка в месяцах */
export function ageInMonths(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
}

/** Форматированный возраст */
export function formatAge(birthDate: string): string {
  const weeks = ageInWeeks(birthDate)
  if (weeks < 4) return `${weeks} нед.`
  const months = ageInMonths(birthDate)
  if (months < 12) return `${months} мес.`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} г.`
  return `${years} г. ${rem} мес.`
}
