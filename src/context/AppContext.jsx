import { createContext, useContext, useState, useCallback } from 'react'
import { loadEntries, saveEntries, loadSettings, saveSettings } from '../utils/storage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [entries, setEntries] = useState(() => loadEntries())
  const [settings, setSettings] = useState(() => loadSettings())

  const createEntry = useCallback((entry) => {
    setEntries((prev) => {
      const next = [...prev, entry]
      saveEntries(next)
      return next
    })
  }, [])

  const updateEntry = useCallback((updated) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e))
      saveEntries(next)
      return next
    })
  }, [])

  const deleteEntry = useCallback((id) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveEntries(next)
      return next
    })
  }, [])

  const updateSettings = useCallback((next) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  return (
    <AppContext.Provider value={{ entries, createEntry, updateEntry, deleteEntry, settings, updateSettings }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
