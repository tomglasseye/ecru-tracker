const ENTRIES_KEY = 'ecru_entries'
const SETTINGS_KEY = 'ecru_settings'
const RECENT_TICKETS_KEY = 'ecru_recent_tickets'

export function loadEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { domain: '', email: '', token: '' }
  } catch {
    return { domain: '', email: '', token: '' }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadRecentTickets() {
  try {
    const raw = localStorage.getItem(RECENT_TICKETS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRecentTicket(ticket) {
  const recent = loadRecentTickets()
  const filtered = recent.filter((t) => t.key !== ticket.key)
  const updated = [ticket, ...filtered].slice(0, 20)
  localStorage.setItem(RECENT_TICKETS_KEY, JSON.stringify(updated))
  return updated
}

export function getPopularTickets(entries) {
  const counts = {}
  const ticketInfo = {}
  for (const entry of entries) {
    if (!entry.ticketKey) continue
    counts[entry.ticketKey] = (counts[entry.ticketKey] || 0) + 1
    ticketInfo[entry.ticketKey] = { key: entry.ticketKey, summary: entry.summary || '' }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key]) => ticketInfo[key])
}
