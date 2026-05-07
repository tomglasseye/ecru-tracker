export const HOUR_HEIGHT = 64
export const START_HOUR = 7
export const END_HOUR = 20
export const TOTAL_HOURS = END_HOUR - START_HOUR
export const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT
export const SNAP_MINUTES = 15

export function minutesToPixels(minutes) {
  return (minutes / 60) * HOUR_HEIGHT
}

export function pixelsToMinutes(px) {
  return (px / HOUR_HEIGHT) * 60
}

export function snapMinutes(minutes) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

export function timeToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes()
}

export function minutesToTime(baseDate, minutes) {
  const d = new Date(baseDate)
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ampm = h >= 12 ? 'pm' : 'am'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${String(m).padStart(2, '0')}${ampm}`
}

export function formatDuration(startMin, endMin) {
  const diff = endMin - startMin
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function minutesToInputTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function inputTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
