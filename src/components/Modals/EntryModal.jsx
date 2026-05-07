import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { X, Trash2, Search, Clock } from 'lucide-react'
import { useJira } from '../../hooks/useJira'
import { useApp } from '../../context/AppContext'
import { addRecentTicket, loadRecentTickets, getPopularTickets } from '../../utils/storage'
import {
  minutesToInputTime,
  inputTimeToMinutes,
  minutesToTime,
  formatDuration,
} from '../../utils/time'

export default function EntryModal({
  type,
  entry,
  day,
  startMinutes,
  endMinutes,
  onClose,
  onSave,
  onDelete,
}) {
  const { entries } = useApp()
  const { searchTickets, demoTickets } = useJira()

  const isEdit = type === 'edit'
  const baseDay = isEdit ? new Date(entry.startTime) : day

  const [ticketKey, setTicketKey] = useState(isEdit ? entry.ticketKey || '' : '')
  const [summary, setSummary] = useState(isEdit ? entry.summary || '' : '')
  const [description, setDescription] = useState(isEdit ? entry.description || '' : '')
  const [startInput, setStartInput] = useState(
    minutesToInputTime(isEdit ? (new Date(entry.startTime).getHours() * 60 + new Date(entry.startTime).getMinutes()) : startMinutes)
  )
  const [endInput, setEndInput] = useState(
    minutesToInputTime(isEdit ? (new Date(entry.endTime).getHours() * 60 + new Date(entry.endTime).getMinutes()) : endMinutes)
  )

  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const searchRef = useRef(null)
  const recentTickets = loadRecentTickets().slice(0, 6)
  const popularTickets = getPopularTickets(entries).slice(0, 6)

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (ticketKey.length >= 2) {
        setSearching(true)
        const results = await searchTickets(ticketKey)
        setSearchResults(results)
        setShowDropdown(true)
        setSearching(false)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)
    return () => clearTimeout(delay)
  }, [ticketKey, searchTickets])

  const selectTicket = (t) => {
    setTicketKey(t.key)
    setSummary(t.summary || '')
    setShowDropdown(false)
  }

  const handleSave = () => {
    if (!ticketKey.trim()) return

    const startMin = inputTimeToMinutes(startInput)
    const endMin = inputTimeToMinutes(endInput)

    if (endMin <= startMin) return

    const startDate = minutesToTime(baseDay, startMin)
    const endDate = minutesToTime(baseDay, endMin)

    const ticket = { key: ticketKey, summary }
    addRecentTicket(ticket)

    onSave({
      id: isEdit ? entry.id : crypto.randomUUID(),
      ticketKey,
      summary,
      description,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    })
  }

  const dur = formatDuration(inputTimeToMinutes(startInput), inputTimeToMinutes(endInput))

  const quickTickets =
    searchResults.length === 0
      ? [...new Map([...popularTickets, ...recentTickets].map((t) => [t.key, t])).values()].slice(
          0,
          8
        )
      : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold text-gray-900">
              {isEdit ? 'Edit time entry' : 'Log time'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {format(baseDay, 'EEEE, d MMMM')} · {dur}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Ticket search */}
          <div className="relative" ref={searchRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Jira ticket
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={ticketKey}
                onChange={(e) => setTicketKey(e.target.value.toUpperCase())}
                placeholder="e.g. DEV-123"
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Search dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                {searchResults.map((t) => (
                  <button
                    key={t.key}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-start gap-2"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectTicket(t)
                    }}
                  >
                    <span className="font-mono font-medium text-blue-600 shrink-0">{t.key}</span>
                    <span className="text-gray-600 truncate">{t.summary}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick-pick chips */}
          {quickTickets.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Popular &amp; recent</p>
              <div className="flex flex-wrap gap-1.5">
                {quickTickets.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => selectTicket(t)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      ticketKey === t.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    title={t.summary}
                  >
                    {t.key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary (auto-filled from Jira) */}
          {summary && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border">
              {summary}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              What were you working on?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note about your work..."
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Time range */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Clock size={11} />
                Start
              </label>
              <input
                type="time"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">End</label>
              <input
                type="time"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-gray-500 pb-2.5 shrink-0">{dur}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!ticketKey.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isEdit ? 'Save changes' : 'Log time'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
