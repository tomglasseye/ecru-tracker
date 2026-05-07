import { useCallback } from 'react'
import Header from '../components/Layout/Header'
import WeekCalendar from '../components/Calendar/WeekCalendar'
import { useApp } from '../context/AppContext'
import { useJira } from '../hooks/useJira'

export default function CalendarPage({ theme, onToggleTheme }) {
  const { entries, createEntry, updateEntry, deleteEntry } = useApp()
  const { deleteWorklog } = useJira()

  const handleUpdate = useCallback(
    (entry) => {
      updateEntry(entry)
      if (entry.worklogId) {
        updateWorklog(entry).catch(() => {}) // best-effort, don't block UI
      }
    },
    [updateEntry, updateWorklog]
  )

  const handleDelete = useCallback(
    async (id) => {
      const entry = entries.find((e) => e.id === id)
      if (entry?.worklogId) {
        deleteWorklog(entry).catch(() => {})
      }
      deleteEntry(id)
    },
    [entries, deleteEntry, deleteWorklog]
  )

  return (
    <div className="flex flex-col h-screen">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <div className="flex-1 overflow-hidden">
        <WeekCalendar
          entries={entries}
          onCreateEntry={createEntry}
          onUpdateEntry={handleUpdate}
          onDeleteEntry={handleDelete}
        />
      </div>
    </div>
  )
}
