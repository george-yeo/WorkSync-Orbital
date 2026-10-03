import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns'

export type DueState = 'overdue' | 'today' | 'soon' | 'later'

export function dueInfo(deadline: string): { label: string; state: DueState } {
  const date = new Date(deadline)
  const days = differenceInCalendarDays(date, new Date())
  if (days < 0)
    return { label: days === -1 ? 'Yesterday' : `${-days} days overdue`, state: 'overdue' }
  if (days === 0) return { label: 'Today', state: 'today' }
  if (days === 1) return { label: 'Tomorrow', state: 'soon' }
  if (days < 7) return { label: format(date, 'EEEE'), state: 'soon' }
  return { label: format(date, isThisYear(date) ? 'd MMM' : 'd MMM yyyy'), state: 'later' }
}

export function messageTime(iso: string): string {
  const d = new Date(iso)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, isThisYear(d) ? 'd MMM, HH:mm' : 'd MMM yyyy')
}

export function relative(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
}

/** yyyy-MM-dd for <input type="date">, in local time. */
export function toDateInput(iso: string | null): string {
  return iso ? format(new Date(iso), 'yyyy-MM-dd') : ''
}

/** Deadline from a date input: end of that local day, as ISO with offset. */
export function fromDateInput(value: string): string | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y!, m! - 1, d!, 23, 59).toISOString()
}
