import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { useTheme } from './hooks/useTheme'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'

function ThemedApp() {
  const { theme, toggle } = useTheme()
  return (
    <Routes>
      <Route path="/" element={<CalendarPage theme={theme} onToggleTheme={toggle} />} />
      <Route path="/settings" element={<SettingsPage theme={theme} onToggleTheme={toggle} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  )
}
