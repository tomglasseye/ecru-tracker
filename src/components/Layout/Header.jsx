import { Link, useLocation } from 'react-router-dom'
import { Settings, Calendar, Sun, Moon } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function Header({ theme, onToggleTheme }) {
  const location = useLocation()
  const { settings } = useApp()
  const hasJira = !!(settings.domain && settings.email && settings.token)

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
          <Calendar size={13} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 dark:text-white text-sm">Ecru Tracker</span>
      </div>

      <div className="flex items-center gap-2">
        {!hasJira && (
          <Link
            to="/settings"
            className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            Connect Jira
          </Link>
        )}
        {hasJira && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-2.5 py-1 rounded-full">
            {settings.domain}
          </span>
        )}

        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <Link
          to="/settings"
          className={`p-1.5 rounded-lg transition-colors ${
            location.pathname === '/settings'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Settings size={16} />
        </Link>
      </div>
    </header>
  )
}
