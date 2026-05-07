import { useState } from 'react'
import { X } from 'lucide-react'
import { minutesToPixels, formatTime, formatDuration, START_HOUR, HOUR_HEIGHT } from '../../utils/time'

const PALETTE = [
  'bg-blue-500 border-blue-600',
  'bg-violet-500 border-violet-600',
  'bg-emerald-500 border-emerald-600',
  'bg-orange-500 border-orange-600',
  'bg-pink-500 border-pink-600',
  'bg-teal-500 border-teal-600',
  'bg-cyan-500 border-cyan-600',
  'bg-rose-500 border-rose-600',
]

function ticketColor(key) {
  let hash = 0
  for (const ch of key || '') hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function TimeBlock({
  entry,
  startMin,
  endMin,
  opacity = 1,
  disabled = false,
  onDragMove,
  onDragResizeTop,
  onDragResizeBottom,
  onDelete,
}) {
  const [hovered, setHovered] = useState(false)

  const top = minutesToPixels(startMin - START_HOUR * 60)
  const height = Math.max(minutesToPixels(endMin - startMin), 20)
  const color = ticketColor(entry.ticketKey)
  const short = height < 42

  return (
    <div
      data-entry
      className={`absolute inset-x-0.5 rounded border select-none group overflow-hidden ${color} text-white cursor-grab active:cursor-grabbing`}
      style={{ top, height, opacity, zIndex: 10 }}
      onMouseDown={disabled ? undefined : onDragMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top resize handle */}
      {!disabled && (
        <div
          className="absolute top-0 inset-x-0 h-2.5 cursor-n-resize z-20 hover:bg-white/20 rounded-t"
          onMouseDown={(e) => {
            e.stopPropagation()
            onDragResizeTop(e)
          }}
        />
      )}

      {/* Content */}
      <div className={`px-1.5 overflow-hidden ${short ? 'py-0.5' : 'pt-2.5 pb-1'}`}>
        <div className="text-xs font-semibold truncate leading-tight">
          {entry.ticketKey}
        </div>
        {!short && entry.summary && (
          <div className="text-xs opacity-90 truncate leading-tight">{entry.summary}</div>
        )}
        {!short && entry.description && (
          <div className="text-xs opacity-70 truncate leading-tight italic">{entry.description}</div>
        )}
        {!short && (
          <div className="text-xs opacity-60 leading-tight mt-0.5">
            {formatTime(startMin)} – {formatTime(endMin)} · {formatDuration(startMin, endMin)}
          </div>
        )}
      </div>

      {/* Delete button */}
      {!disabled && hovered && (
        <button
          className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 z-30"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <X size={10} />
        </button>
      )}

      {/* Bottom resize handle */}
      {!disabled && (
        <div
          className="absolute bottom-0 inset-x-0 h-2.5 cursor-s-resize z-20 hover:bg-white/20 rounded-b"
          onMouseDown={(e) => {
            e.stopPropagation()
            onDragResizeBottom(e)
          }}
        />
      )}
    </div>
  )
}
