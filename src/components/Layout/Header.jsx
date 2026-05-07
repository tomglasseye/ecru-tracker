import { Link, useLocation } from 'react-router-dom'
import { Settings, Calendar } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function Header() {
  const location = useLocation()
  const { settings } = useApp()
  const hasJira = !!(settings.domain && settings.email && settings.token)

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b bg-white shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <Calendar size={13} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Ecru Tracker</span>
      </div>

      <div className="flex items-center gap-2">
        {!hasJira && (
          <Link
            to="/settings"
            className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors"
          >
            Connect Jira
          </Link>
        )}
        {hasJira && (
          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            {settings.domain}
          </span>
        )}
        <Link
          to="/settings"
          className={`p-1.5 rounded-lg transition-colors ${
            location.pathname === '/settings'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Settings size={16} />
        </Link>
      </div>
    </header>
  )
}
