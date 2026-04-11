'use client'

import type { Capture } from '@/lib/types'

function formatAge(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function formatContent(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="border-b transition-colors"
        style={{ color: 'var(--accent2)', borderColor: 'var(--border)' }}
      >
        {part.length > 50 ? part.slice(0, 50) + '…' : part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

interface CycleCardProps {
  capture: Capture
  onClose: (id: string) => void
  onDelete: (id: string) => void
}

export default function CycleCard({ capture, onClose, onDelete }: CycleCardProps) {
  const isHigh = capture.urgency === 'high' && capture.status !== 'closed'

  const cardBorderLeft =
    isHigh                          ? '2px solid #c84030' :
    capture.status === 'stale'      ? '2px solid rgba(232,130,10,0.5)' :
    capture.status === 'closed'     ? '2px solid rgba(60,60,60,0.2)' :
    '2px solid rgba(200,160,80,0.4)'

  const statusLabel = capture.status === 'stale' ? 'STALE' : capture.status.toUpperCase()

  const statusStyle =
    capture.status === 'stale'  ? { background: 'rgba(232,130,10,0.12)',  color: '#e8820a', border: '1px solid rgba(232,130,10,0.25)' } :
    capture.status === 'closed' ? { background: 'rgba(60,60,60,0.15)',    color: '#4a4a4a', border: '1px solid rgba(60,60,60,0.2)' } :
                                  { background: 'rgba(200,160,80,0.12)',  color: '#c8a050', border: '1px solid rgba(200,160,80,0.25)' }

  return (
    <div
      className="rounded-sm border mb-2.5 p-4 transition-all relative"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        borderLeft: cardBorderLeft,
        opacity: capture.status === 'closed' ? 0.55 : 1,
        animation: 'slideIn 0.25s ease',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1 text-sm leading-relaxed break-words" style={{ lineHeight: '1.65' }}>
          {formatContent(capture.content)}

          {capture.screenshot && (
            <div className="mt-2.5">
              <img
                src={capture.screenshot}
                alt="screenshot"
                className="max-w-full max-h-40 rounded-sm border"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
          )}

          {capture.insight && (
            <div
              className="mt-2.5 px-3 py-2 rounded-sm"
              style={{
                background: 'var(--surface2)',
                borderLeft: `2px solid ${isHigh ? '#c84030' : 'var(--accent)'}`,
              }}
            >
              <div
                className="font-mono mb-1"
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isHigh ? '#c84030' : 'var(--accent)',
                }}
              >
                // cura
              </div>
              <div className="text-xs leading-relaxed italic" style={{ color: 'var(--muted)' }}>
                {capture.insight}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 flex-shrink-0">
          {capture.status !== 'closed' && (
            <ActionBtn onClick={() => onClose(capture.id)} title="Close cycle" closeStyle>
              ✓
            </ActionBtn>
          )}
          <ActionBtn onClick={() => onDelete(capture.id)} title="Delete">
            ×
          </ActionBtn>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        {capture.context && (
          <span
            className="font-mono px-2 py-0.5 rounded-sm text-xs"
            style={{ background: 'var(--surface2)', color: 'var(--accent)', fontSize: '10px', letterSpacing: '0.08em' }}
          >
            {capture.context.name}
          </span>
        )}
        <span className="font-mono text-xs" style={{ color: 'var(--muted)', fontSize: '10px', letterSpacing: '0.05em' }}>
          {formatAge(capture.created_at)}
        </span>
        <span
          className="font-mono px-2 py-0.5 rounded-sm text-xs"
          style={{ ...statusStyle, fontSize: '10px', letterSpacing: '0.08em' }}
        >
          {statusLabel}
        </span>
        {isHigh && (
          <span
            className="font-mono px-2 py-0.5 rounded-sm text-xs"
            style={{ background: 'rgba(200,64,48,0.12)', color: '#c84030', border: '1px solid rgba(200,64,48,0.25)', fontSize: '10px', letterSpacing: '0.08em' }}
          >
            HIGH
          </span>
        )}
      </div>
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  title,
  closeStyle,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  closeStyle?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-sm border text-sm leading-none p-1.5 transition-all"
      style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = closeStyle ? 'var(--closed)' : 'var(--accent)'
        e.currentTarget.style.color = closeStyle ? 'var(--closed)' : 'var(--accent)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--muted)'
      }}
    >
      {children}
    </button>
  )
}
