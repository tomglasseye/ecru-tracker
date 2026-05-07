import { useState, useRef, useEffect, useCallback } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TimeBlock from './TimeBlock'
import EntryModal from '../Modals/EntryModal'
import {
  HOUR_HEIGHT,
  START_HOUR,
  END_HOUR,
  TOTAL_HOURS,
  GRID_HEIGHT,
  minutesToPixels,
  snapMinutes,
  timeToMinutes,
  minutesToTime,
  formatTime,
} from '../../utils/time'

const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

function formatHourLabel(h) {
  if (h === 0) return ''
  if (h === 12) return '12 PM'
  return h > 12 ? `${h - 12} PM` : `${h} AM`
}

export default function WeekCalendar({ entries, onCreateEntry, onUpdateEntry, onDeleteEntry }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modal, setModal] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [nowLine, setNowLine] = useState(null)

  const scrollRef = useRef(null)
  const dragRef = useRef(null)
  const callbacksRef = useRef({ onCreateEntry, onUpdateEntry, onDeleteEntry })

  useEffect(() => {
    callbacksRef.current = { onCreateEntry, onUpdateEntry, onDeleteEntry }
  })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const daysRef = useRef(days)
  daysRef.current = days

  // Current time indicator
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const min = now.getHours() * 60 + now.getMinutes()
      if (min >= START_HOUR * 60 && min <= END_HOUR * 60) {
        setNowLine({ top: minutesToPixels(min - START_HOUR * 60), day: now.toDateString() })
      }
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])

  // Scroll to 8am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = minutesToPixels((8 - START_HOUR) * 60)
    }
  }, [])

  const getRelativeY = useCallback((clientY) => {
    const el = scrollRef.current
    return clientY - el.getBoundingClientRect().top + el.scrollTop
  }, [])

  const yToMinutes = useCallback(
    (y) => {
      const raw = (y / GRID_HEIGHT) * TOTAL_HOURS * 60 + START_HOUR * 60
      return Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, snapMinutes(raw)))
    },
    []
  )

  const getDayIndex = useCallback((clientX) => {
    if (!scrollRef.current) return -1
    const cols = scrollRef.current.querySelectorAll('[data-day-col]')
    for (let i = 0; i < cols.length; i++) {
      const r = cols[i].getBoundingClientRect()
      if (clientX >= r.left && clientX < r.right) return i
    }
    return -1
  }, [])

  const handleGridMouseDown = useCallback(
    (e, dayIndex) => {
      if (e.button !== 0) return
      if (e.target.closest('[data-entry]')) return

      const y = getRelativeY(e.clientY)
      const startMin = yToMinutes(y)

      dragRef.current = {
        type: 'create',
        dayIndex,
        startMin,
        endMin: startMin + 60,
        anchorMin: startMin,
        days: daysRef.current,
      }

      setDragging({ type: 'create', dayIndex, startMinutes: startMin, endMinutes: startMin + 60 })
      e.preventDefault()
    },
    [getRelativeY, yToMinutes]
  )

  const handleEntryDragStart = useCallback(
    (e, entry, type) => {
      e.stopPropagation()
      if (e.button !== 0) return

      const y = getRelativeY(e.clientY)
      const startMin = timeToMinutes(new Date(entry.startTime))
      const endMin = timeToMinutes(new Date(entry.endTime))
      const dayIndex = daysRef.current.findIndex(
        (d) => d.toDateString() === new Date(entry.startTime).toDateString()
      )
      const startClientX = e.clientX
      const startClientY = e.clientY

      dragRef.current = {
        type,
        entry,
        startMin,
        endMin,
        dayIndex,
        days: daysRef.current,
        offsetMin: type === 'move' ? yToMinutes(y) - startMin : 0,
        startClientX,
        startClientY,
        moved: false,
        onClickEntry: type === 'move' ? entry : null,
      }

      setDragging({ type, entryId: entry.id, dayIndex, startMinutes: startMin, endMinutes: endMin })
      e.preventDefault()
    },
    [getRelativeY, yToMinutes]
  )

  useEffect(() => {
    const handleMouseMove = (e) => {
      const dr = dragRef.current
      if (!dr) return

      // Mark as a real drag once the mouse moves more than 5px
      if (!dr.moved && dr.startClientX !== undefined) {
        const dx = Math.abs(e.clientX - dr.startClientX)
        const dy = Math.abs(e.clientY - dr.startClientY)
        if (dx > 5 || dy > 5) dr.moved = true
      }

      const y = getRelativeY(e.clientY)
      const curMin = yToMinutes(y)

      if (dr.type === 'create') {
        let s = dr.anchorMin
        let end = curMin
        if (curMin < dr.anchorMin) {
          s = curMin
          end = dr.anchorMin
        }
        end = Math.max(end, s + 15)
        dr.startMin = s
        dr.endMin = end
        setDragging((prev) => ({ ...prev, startMinutes: s, endMinutes: end }))
      } else if (dr.type === 'move') {
        const newDayIndex = getDayIndex(e.clientX)
        if (newDayIndex >= 0) dr.dayIndex = newDayIndex
        const duration = dr.endMin - dr.startMin
        const newStart = snapMinutes(curMin - dr.offsetMin)
        const clamped = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - duration, newStart))
        dr.currentStartMin = clamped
        dr.currentEndMin = clamped + duration
        setDragging((prev) => ({
          ...prev,
          dayIndex: dr.dayIndex,
          startMinutes: clamped,
          endMinutes: clamped + duration,
        }))
      } else if (dr.type === 'resize-bottom') {
        const newEnd = Math.max(curMin, dr.startMin + 15)
        const clamped = Math.min(newEnd, END_HOUR * 60)
        dr.currentEndMin = clamped
        setDragging((prev) => ({ ...prev, endMinutes: clamped }))
      } else if (dr.type === 'resize-top') {
        const newStart = Math.min(curMin, dr.endMin - 15)
        const clamped = Math.max(newStart, START_HOUR * 60)
        dr.currentStartMin = clamped
        setDragging((prev) => ({ ...prev, startMinutes: clamped }))
      }
    }

    const handleMouseUp = () => {
      const dr = dragRef.current
      if (!dr) return
      dragRef.current = null

      if (dr.type === 'create') {
        const dur = dr.endMin - dr.startMin
        if (dur >= 15) {
          setModal({
            type: 'create',
            day: dr.days[dr.dayIndex],
            startMinutes: dr.startMin,
            endMinutes: dr.endMin,
          })
        }
      } else if (dr.type === 'move') {
        if (dr.moved) {
          const targetDay = dr.days[dr.dayIndex]
          const s = minutesToTime(targetDay, dr.currentStartMin ?? dr.startMin)
          const end = minutesToTime(targetDay, dr.currentEndMin ?? dr.endMin)
          callbacksRef.current.onUpdateEntry({
            ...dr.entry,
            startTime: s.toISOString(),
            endTime: end.toISOString(),
          })
        }
      } else if (dr.type === 'resize-bottom') {
        const endDate = minutesToTime(
          new Date(dr.entry.startTime),
          dr.currentEndMin ?? dr.endMin
        )
        callbacksRef.current.onUpdateEntry({ ...dr.entry, endTime: endDate.toISOString() })
      } else if (dr.type === 'resize-top') {
        const startDate = minutesToTime(
          new Date(dr.entry.endTime),
          dr.currentStartMin ?? dr.startMin
        )
        callbacksRef.current.onUpdateEntry({ ...dr.entry, startTime: startDate.toISOString() })
      }

      setDragging(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [getDayIndex, getRelativeY, yToMinutes])

  const prevWeek = () => setCurrentDate((d) => addDays(d, -7))
  const nextWeek = () => setCurrentDate((d) => addDays(d, 7))
  const goToday = () => setCurrentDate(new Date())

  const isToday = (day) => day.toDateString() === new Date().toDateString()

  const TARGET_MINUTES = 7 * 60
  function dayTrackedMinutes(day) {
    return entries
      .filter((e) => new Date(e.startTime).toDateString() === day.toDateString())
      .reduce((sum, e) => sum + (new Date(e.endTime) - new Date(e.startTime)) / 60000, 0)
  }

  // Build display entries per day, accounting for cross-day moves
  function getDisplayEntries(dayIndex) {
    const day = days[dayIndex]

    const base = entries.filter(
      (e) => new Date(e.startTime).toDateString() === day.toDateString()
    )

    if (dragging?.type !== 'move') return base.map((e) => ({ ...e, _state: 'normal' }))

    const movedId = dragging.entryId
    const movedEntry = entries.find((e) => e.id === movedId)
    if (!movedEntry) return base.map((e) => ({ ...e, _state: 'normal' }))

    const originalDayIndex = days.findIndex(
      (d) => d.toDateString() === new Date(movedEntry.startTime).toDateString()
    )

    const result = base.map((e) => {
      if (e.id !== movedId) return { ...e, _state: 'normal' }
      if (dragging.dayIndex === dayIndex) {
        return { ...e, _state: 'moved-here' }
      }
      return { ...e, _state: 'ghost' }
    })

    // Add moved entry to target day column if it came from another day
    if (dragging.dayIndex === dayIndex && originalDayIndex !== dayIndex) {
      result.push({ ...movedEntry, _state: 'moved-here' })
    }

    return result
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={goToday}
          className="px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="text-sm font-semibold text-gray-800 dark:text-white">
          {format(weekStart, 'MMMM yyyy')}
        </span>
      </div>

      {/* Day headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900">
        <div className="w-14 shrink-0" />
        {days.map((day, i) => {
          const tracked = dayTrackedMinutes(day)
          const pct = Math.min(tracked / TARGET_MINUTES, 1)
          const isFull = tracked >= TARGET_MINUTES
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-gray-200 dark:border-gray-700 first:border-l-0">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-xl font-medium mx-auto w-8 h-8 flex items-center justify-center rounded-full mt-0.5 transition-colors ${
                  isToday(day)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="mx-2 mt-1.5 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex flex-1 overflow-auto">
        {/* Time labels */}
        <div className="w-14 shrink-0 relative bg-white dark:bg-gray-900" style={{ height: GRID_HEIGHT }}>
          {HOURS.slice(0, -1).map((h) => (
            <div
              key={h}
              className="absolute right-2 text-xs text-gray-400 dark:text-gray-600 leading-none"
              style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 7 }}
            >
              {formatHourLabel(h)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIndex) => {
          const displayEntries = getDisplayEntries(dayIndex)

          return (
            <div
              key={dayIndex}
              data-day-col={dayIndex}
              className={`flex-1 relative border-l border-gray-200 dark:border-gray-700 ${isToday(day) ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'}`}
              style={{ height: GRID_HEIGHT, cursor: 'crosshair', userSelect: 'none' }}
              onMouseDown={(e) => handleGridMouseDown(e, dayIndex)}
            >
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-gray-100 dark:border-gray-800"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                />
              ))}
              {/* Quarter-hour lines (15 min and 45 min marks) */}
              {HOURS.slice(0, -1).flatMap((h) =>
                [1, 3].map((q) => (
                  <div
                    key={`${h}q${q}`}
                    className="absolute inset-x-0 border-t border-gray-100/60 dark:border-gray-800/40"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT + (q * HOUR_HEIGHT) / 4 }}
                  />
                ))
              )}
              {/* Half-hour lines */}
              {HOURS.slice(0, -1).map((h) => (
                <div
                  key={`${h}h`}
                  className="absolute inset-x-0 border-t border-gray-100 dark:border-gray-800/70"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                />
              ))}

              {/* Now indicator */}
              {nowLine && isToday(day) && (
                <div
                  className="absolute inset-x-0 flex items-center pointer-events-none z-20"
                  style={{ top: nowLine.top }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                  <div className="flex-1 border-t-2 border-red-500" />
                </div>
              )}

              {/* Create ghost */}
              {dragging?.type === 'create' && dragging.dayIndex === dayIndex && (
                <div
                  className="absolute inset-x-0.5 bg-blue-200 dark:bg-blue-800 border-2 border-blue-400 dark:border-blue-500 rounded opacity-80 pointer-events-none z-10"
                  style={{
                    top: minutesToPixels(dragging.startMinutes - START_HOUR * 60),
                    height: Math.max(
                      minutesToPixels(dragging.endMinutes - dragging.startMinutes),
                      15
                    ),
                  }}
                >
                  <div className="text-xs text-blue-700 dark:text-blue-200 font-medium px-1.5 py-0.5">
                    {formatTime(dragging.startMinutes)} – {formatTime(dragging.endMinutes)}
                  </div>
                </div>
              )}

              {/* Entries */}
              {displayEntries.map((entry) => {
                const isMoved = entry._state === 'moved-here'
                const isGhost = entry._state === 'ghost'
                const isResizingTop =
                  dragging?.type === 'resize-top' && dragging.entryId === entry.id
                const isResizingBottom =
                  dragging?.type === 'resize-bottom' && dragging.entryId === entry.id

                let startMin = timeToMinutes(new Date(entry.startTime))
                let endMin = timeToMinutes(new Date(entry.endTime))

                if (isMoved) {
                  startMin = dragging.startMinutes
                  endMin = dragging.endMinutes
                } else if (isResizingTop) {
                  startMin = dragging.startMinutes
                } else if (isResizingBottom) {
                  endMin = dragging.endMinutes
                }

                const realEntry = entries.find((e) => e.id === entry.id) || entry

                return (
                  <TimeBlock
                    key={`${entry.id}-${entry._state}`}
                    entry={realEntry}
                    startMin={startMin}
                    endMin={endMin}
                    opacity={isGhost ? 0.3 : 1}
                    disabled={isGhost}
                    onDragMove={(e) => handleEntryDragStart(e, realEntry, 'move')}
                    onDragResizeTop={(e) => handleEntryDragStart(e, realEntry, 'resize-top')}
                    onDragResizeBottom={(e) => handleEntryDragStart(e, realEntry, 'resize-bottom')}
                    onClickEdit={() => setModal({ type: 'edit', entry: realEntry })}
                    onDelete={() => callbacksRef.current.onDeleteEntry(realEntry.id)}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <EntryModal
          {...modal}
          onClose={() => setModal(null)}
          onSave={(entry) => {
            if (modal.type === 'create') callbacksRef.current.onCreateEntry(entry)
            else callbacksRef.current.onUpdateEntry(entry)
            setModal(null)
          }}
          onDelete={
            modal.type === 'edit'
              ? () => {
                  callbacksRef.current.onDeleteEntry(modal.entry.id)
                  setModal(null)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
