'use client'

import { LogoHeader } from './Logo'

interface HeaderProps {
  openCount: number
  closedCount: number
  instantInsight: boolean
  onToggleInsight: () => void
  onToggleContextManager: () => void

}

export default function Header({
  openCount,
  closedCount,
  instantInsight,
  onToggleInsight,
  onToggleContextManager,
}: HeaderProps) {
  return (
    <div
      className="border-b flex-shrink-0"
      style={{ borderColor: 'var(--border)', background: 'transparent', overflow: 'visible' }}
    >
      {/* Row 1: logo + score */}
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(14px + env(safe-area-inset-top))', paddingBottom: '10px', overflow: 'visible' }}
      >
        <LogoHeader />

        <div className="text-right">
          <div className="font-mono" style={{ color: 'var(--muted)', fontSize: '9px', letterSpacing: '0.05em' }}>
            OPEN / CLOSED
          </div>
          <div className="font-display leading-none" style={{ fontSize: '26px', letterSpacing: '2px' }}>
            <span style={{ color: 'var(--open)' }}>{openCount}</span>
            <span style={{ color: 'var(--border)' }}> / </span>
            <span style={{ color: 'var(--closed)' }}>{closedCount}</span>
          </div>
        </div>
      </div>

      {/* Row 2: action buttons */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <HeaderBtn
          active={instantInsight}
          activeColor="var(--closed)"
          onClick={onToggleInsight}
        >
          {instantInsight ? 'INSIGHT: ON' : 'INSIGHT: OFF'}
        </HeaderBtn>
        <HeaderBtn onClick={onToggleContextManager}>CONTEXTS</HeaderBtn>
      </div>
    </div>
  )
}

function HeaderBtn({
  children,
  onClick,
  active,
  activeColor,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  activeColor?: string
}) {
  return (
    <button
      onClick={onClick}
      className="font-mono rounded-sm border transition-all"
      style={{
        background: 'transparent',
        borderColor: active ? (activeColor ?? 'var(--accent)') : 'var(--border)',
        color: active ? (activeColor ?? 'var(--accent)') : 'var(--muted)',
        fontSize: '10px',
        letterSpacing: '0.08em',
        padding: '5px 10px',
      }}
    >
      {children}
    </button>
  )
}
