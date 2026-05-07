import { useState } from 'react'
import { Lock } from 'lucide-react'

const STORAGE_KEY = 'ecru_auth'
const CORRECT = import.meta.env.VITE_APP_PASSWORD

export function isAuthenticated() {
  if (!CORRECT) return true
  return localStorage.getItem(STORAGE_KEY) === CORRECT
}

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(isAuthenticated)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (authed) return children

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === CORRECT) {
      localStorage.setItem(STORAGE_KEY, CORRECT)
      setAuthed(true)
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Ecru Tracker</h1>
          <p className="text-sm text-gray-500">Enter the team password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-3">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              error
                ? 'border-red-400 focus:ring-red-300 bg-red-50'
                : 'focus:ring-blue-500 focus:border-transparent'
            }`}
          />
          {error && (
            <p className="text-xs text-red-600 text-center">Incorrect password — try again</p>
          )}
          <button
            type="submit"
            disabled={!input}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
