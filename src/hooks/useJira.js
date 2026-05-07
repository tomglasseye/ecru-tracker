import { useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext'

const DEMO_TICKETS = [
  { key: 'DEV-101', summary: 'Fix login page redirect bug' },
  { key: 'DEV-102', summary: 'Update user profile API' },
  { key: 'DEV-103', summary: 'Implement dark mode' },
  { key: 'DEV-104', summary: 'Write unit tests for auth module' },
  { key: 'DEV-105', summary: 'Performance optimisation sprint' },
  { key: 'DES-22', summary: 'Redesign onboarding flow' },
  { key: 'DES-23', summary: 'Update brand colour palette' },
  { key: 'OPS-8', summary: 'Set up staging environment' },
  { key: 'OPS-9', summary: 'Migrate database to new server' },
]

export function useJira() {
  const { settings } = useApp()
  const cacheRef = useRef({})

  const hasCredentials = !!(settings.domain && settings.email && settings.token)

  const searchTickets = useCallback(
    async (query) => {
      if (!query || query.length < 2) return []

      const cacheKey = `search:${query}`
      if (cacheRef.current[cacheKey]) return cacheRef.current[cacheKey]

      if (!hasCredentials) {
        const q = query.toLowerCase()
        return DEMO_TICKETS.filter(
          (t) => t.key.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q)
        )
      }

      try {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...settings, query }),
        })
        const data = await res.json()
        cacheRef.current[cacheKey] = data
        setTimeout(() => delete cacheRef.current[cacheKey], 30000)
        return data
      } catch {
        return []
      }
    },
    [hasCredentials, settings]
  )

  const callWorklog = useCallback(
    async (payload) => {
      if (!hasCredentials) return { ok: true, demo: true }
      const res = await fetch('/api/worklog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...payload }),
      })
      return res.json()
    },
    [hasCredentials, settings]
  )

  const createWorklog = useCallback(
    (entry) =>
      callWorklog({
        action: 'create',
        ticketKey: entry.ticketKey,
        started: entry.startTime,
        timeSpentSeconds: Math.round((new Date(entry.endTime) - new Date(entry.startTime)) / 1000),
        comment: entry.description || '',
      }),
    [callWorklog]
  )

  const updateWorklog = useCallback(
    (entry) =>
      callWorklog({
        action: 'update',
        ticketKey: entry.ticketKey,
        worklogId: entry.worklogId,
        started: entry.startTime,
        timeSpentSeconds: Math.round((new Date(entry.endTime) - new Date(entry.startTime)) / 1000),
        comment: entry.description || '',
      }),
    [callWorklog]
  )

  const deleteWorklog = useCallback(
    (entry) =>
      entry.worklogId
        ? callWorklog({ action: 'delete', ticketKey: entry.ticketKey, worklogId: entry.worklogId })
        : Promise.resolve({ ok: true }),
    [callWorklog]
  )

  return { searchTickets, createWorklog, updateWorklog, deleteWorklog, hasCredentials, demoTickets: DEMO_TICKETS }
}
