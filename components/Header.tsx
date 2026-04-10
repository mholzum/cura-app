'use client'

interface HeaderProps {
  openCount: number
  closedCount: number
  instantInsight: boolean
  onToggleInsight: () => void
  onToggleContextManager: () => void
  onSignOut: () => void
}

export default function Header({
  openCount,
  closedCount,
  instantInsight,
  onToggleInsight,
  onToggleContextManager,
  onSignOut,
}: HeaderProps) {
  return (
    <div
      className="flex items-center justify-between border-b mb-7"
      style={{
        borderColor: 'var(--border)',
        paddingTop: 'calc(28px + env(safe-area-inset-top))',
        paddingBottom: '20px',
      }}
    >
      {/* Logo */}
      <svg width="130" height="44" viewBox="0 0 160 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="0"  y="46" fontFamily="Bebas Neue, sans-serif" fontSize="52" fill="#c9a84c" opacity="0.5">C</text>
        <text x="31" y="46" fontFamily="Bebas Neue, sans-serif" fontSize="52" fill="#e8e4de" opacity="0.58">U</text>
        <text x="62" y="46" fontFamily="Bebas Neue, sans-serif" fontSize="52" fill="#e8e4de" opacity="0.78">R</text>
        <text x="91" y="46" fontFamily="Bebas Neue, sans-serif" fontSize="52" fill="#7a9eb5" opacity="1">A</text>
        <line x1="2"  y1="50" x2="26"  y2="50" stroke="#c9a84c" strokeWidth="1"   opacity="0.35"/>
        <line x1="31" y1="50" x2="58"  y2="50" stroke="#e8e4de" strokeWidth="1.2" opacity="0.36"/>
        <line x1="62" y1="50" x2="88"  y2="50" stroke="#e8e4de" strokeWidth="1.5" opacity="0.58"/>
        <line x1="91" y1="50" x2="128" y2="50" stroke="#7a9eb5" strokeWidth="2.5" opacity="1"/>
      </svg>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <HeaderBtn
          active={instantInsight}
          activeColor="var(--closed)"
          onClick={onToggleInsight}
        >
          {instantInsight ? 'INSIGHT: ON' : 'INSIGHT: OFF'}
        </HeaderBtn>
        <HeaderBtn onClick={onToggleContextManager}>CONTEXTS</HeaderBtn>
        <HeaderBtn onClick={onSignOut}>OUT</HeaderBtn>

        {/* Score */}
        <div className="text-right ml-1">
          <div className="font-mono text-xs tracking-wider" style={{ color: 'var(--muted)', fontSize: '10px' }}>
            OPEN / CLOSED
          </div>
          <div className="font-display text-2xl leading-none tracking-widest">
            <span style={{ color: 'var(--open)' }}>{openCount}</span>
            <span style={{ color: 'var(--border)' }}> / </span>
            <span style={{ color: 'var(--closed)' }}>{closedCount}</span>
          </div>
        </div>
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
      className="font-mono text-xs tracking-wider px-2 py-1 rounded-sm border transition-all"
      style={{
        background: 'transparent',
        borderColor: active ? (activeColor ?? 'var(--accent)') : 'var(--border)',
        color: active ? (activeColor ?? 'var(--accent)') : 'var(--muted)',
        fontSize: '10px',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </button>
  )
}
