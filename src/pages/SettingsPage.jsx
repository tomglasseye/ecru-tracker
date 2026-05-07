import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Header from '../components/Layout/Header'
import { useApp } from '../context/AppContext'

export default function SettingsPage() {
  const { settings, updateSettings } = useApp()
  const navigate = useNavigate()

  const [domain, setDomain] = useState(settings.domain)
  const [email, setEmail] = useState(settings.email)
  const [token, setToken] = useState(settings.token)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({ domain: domain.trim(), email: email.trim(), token: token.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), email: email.trim(), token: token.trim(), query: '' }),
      })
      if (res.ok) {
        setTestResult({ ok: true, message: 'Connected successfully!' })
      } else {
        const err = await res.json()
        setTestResult({ ok: false, message: err.error || 'Connection failed. Check your credentials.' })
      }
    } catch {
      setTestResult({ ok: false, message: 'Could not reach the server. Make sure you\'re running via Netlify dev.' })
    }
    setTesting(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to calendar
          </button>

          <h1 className="text-xl font-semibold text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-500 mb-8">
            Connect your Jira account to search tickets and log time.
          </p>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b">
              <h2 className="font-medium text-gray-900">Jira connection</h2>
              <p className="text-xs text-gray-500 mt-1">
                Uses your API token — credentials are stored locally in your browser only.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Jira domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="yourcompany.atlassian.net"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>API token</span>
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Get token
                    <ExternalLink size={10} />
                  </a>
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {testResult && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    testResult.ok
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle size={15} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={handleTest}
                disabled={!domain || !email || !token || testing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? 'Testing…' : 'Test connection'}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b">
              <h2 className="font-medium text-gray-900">How it works</h2>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-gray-600">
              <p>
                <strong className="text-gray-900">Without Jira:</strong> The calendar works fully
                offline — entries are saved in your browser. Ticket search returns demo results.
              </p>
              <p>
                <strong className="text-gray-900">With Jira:</strong> Ticket search queries your
                Jira instance. When you save an entry, the time is also logged as a native Jira
                worklog on the ticket (visible in the ticket and in Time &amp; Cost Tracker reports).
              </p>
              <p>
                <strong className="text-gray-900">Privacy:</strong> Your API token never leaves
                your browser except to call Jira via the Netlify function proxy (required to avoid
                browser CORS restrictions). It is not stored on any server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
