import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { GripVertical, X } from 'lucide-react'
import { minutesToPixels, formatTime, formatDuration, START_HOUR } from '../../utils/time'

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
  onClickEdit,
  onDelete,
}) {
  const [hovered, setHovered] = useState(false)
  const [tooltipPos, setTooltipPos] = useState(null)
  const blockRef = useRef(null)

  const top = minutesToPixels(startMin - START_HOUR * 60)
  const height = Math.max(minutesToPixels(endMin - startMin), 20)
  const color = ticketColor(entry.ticketKey)
  const short = height < 44
  const veryShort = height < 26

  // Resize zone height: proportional but capped so it's always useful
  const resizeZone = Math.max(Math.min(height * 0.22, 14), 6)
  // Only show separate resize zones when there's enough room
  const showResizeZones = height >= 30

  const handleMouseEnter = useCallback(() => {
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect()
      setTooltipPos(rect)
    }
    setHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setTooltipPos(null)
  }, [])

  // Tooltip positioning: prefer right, fall back to left if near edge
  const getTooltipStyle = () => {
    if (!tooltipPos) return {}
    const TIP_WIDTH = 220
    const TIP_GAP = 8
    const toRight = tooltipPos.right + TIP_GAP + TIP_WIDTH
    const left =
      toRight <= window.innerWidth
        ? tooltipPos.right + TIP_GAP
        : tooltipPos.left - TIP_WIDTH - TIP_GAP
    const top = Math.max(8, Math.min(tooltipPos.top, window.innerHeight - 180))
    return { position: 'fixed', top, left, width: TIP_WIDTH, zIndex: 9999 }
  }

  return (
    <>
      <div
        ref={blockRef}
        data-entry
        className={`absolute inset-x-0.5 rounded border select-none overflow-hidden flex ${color} text-white`}
        style={{ top, height, opacity, zIndex: 10 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Left drag handle ── */}
        {!disabled && (
          <div className="w-5 shrink-0 flex flex-col border-r border-white/20">
            {showResizeZones ? (
              <>
                {/* Top → resize start earlier */}
                <div
                  className="shrink-0 cursor-n-resize hover:bg-white/25 transition-colors"
                  style={{ height: resizeZone }}
                  onMouseDown={(e) => { e.stopPropagation(); onDragResizeTop(e) }}
                />
                {/* Middle → move */}
                <div
                  className="flex-1 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors flex items-center justify-center"
                  onMouseDown={(e) => { e.stopPropagation(); onDragMove(e) }}
                >
                  {!veryShort && <GripVertical size={11} className="opacity-50" />}
                </div>
                {/* Bottom → resize end later */}
                <div
                  className="shrink-0 cursor-s-resize hover:bg-white/25 transition-colors"
                  style={{ height: resizeZone }}
                  onMouseDown={(e) => { e.stopPropagation(); onDragResizeBottom(e) }}
                />
              </>
            ) : (
              /* Very short tile: full handle = move only */
              <div
                className="flex-1 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors flex items-center justify-center"
                onMouseDown={(e) => { e.stopPropagation(); onDragMove(e) }}
              />
            )}
          </div>
        )}

        {/* ── Content area — click to edit ── */}
        <div
          className={`flex-1 overflow-hidden min-w-0 relative ${!disabled ? 'cursor-pointer hover:bg-white/5' : ''} ${veryShort ? 'py-0 px-1' : short ? 'py-0.5 px-1.5' : 'py-1.5 px-1.5'}`}
          onClick={disabled ? undefined : (e) => { e.stopPropagation(); onClickEdit() }}
        >
          <div className="text-xs font-semibold truncate leading-tight">{entry.ticketKey}</div>
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

          {/* Delete button — top-right on hover */}
          {!disabled && hovered && (
            <button
              className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <X size={9} />
            </button>
          )}
        </div>
      </div>

      {/* ── Hover tooltip (portal, avoids overflow clipping) ── */}
      {hovered && !disabled && tooltipPos && createPortal(
        <div
          style={getTooltipStyle()}
          className="bg-gray-900 dark:bg-gray-800 border border-gray-700 dark:border-gray-600 text-white rounded-xl shadow-2xl p-3 pointer-events-none text-xs"
        >
          <div className="font-mono font-bold text-orange-300 text-sm">{entry.ticketKey}</div>
          {entry.summary && (
            <div className="mt-1 font-medium text-white leading-snug">{entry.summary}</div>
          )}
          {entry.description && (
            <div className="mt-1.5 text-gray-300 leading-snug italic border-t border-gray-700 pt-1.5">
              {entry.description}
            </div>
          )}
          <div className="mt-2 text-gray-400 border-t border-gray-700 pt-1.5 flex items-center justify-between">
            <span>{formatTime(startMin)} – {formatTime(endMin)}</span>
            <span className="font-medium text-gray-300">{formatDuration(startMin, endMin)}</span>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
