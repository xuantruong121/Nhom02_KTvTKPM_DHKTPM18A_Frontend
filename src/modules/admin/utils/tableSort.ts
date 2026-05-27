import dayjs from 'dayjs'

export function compareText(left?: string | number | null, right?: string | number | null) {
  return String(left ?? '').localeCompare(String(right ?? ''), 'vi', { numeric: true })
}

export function compareNumber(left?: string | number | null, right?: string | number | null) {
  return Number(left ?? 0) - Number(right ?? 0)
}

export function compareDate(left?: string | null, right?: string | null) {
  return dayjs(left ?? 0).valueOf() - dayjs(right ?? 0).valueOf()
}
