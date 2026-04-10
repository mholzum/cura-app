'use client'

interface WeeklyDigestProps {
  content: string | null
  loading: boolean
  onClose: () => void
}

export default function WeeklyDigest({ content, loading, onClose }: WeeklyDigestProps) {
  return (
    <div
      className="rounded-sm border p-6 mb-6"
      style={{ borderColor: 'var(--closed)', background: 'var(--surface)', animation: 'slideIn 0.3s ease' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl tracking-widest" style={{ color: 'var(--closed)' }}>
          WEEKLY DIGEST
        </h3>
        <button onClick={onClose} className="font-mono text-lg leading-none" style={{ color: 'var(--muted)' }}>
          ×
        </button>
      </div>
      {loading ? (
        <p className="font-mono text-xs italic" style={{ color: 'var(--muted)' }}>
          Reading your patterns...
        </p>
      ) : (
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ lineHeight: '1.8', color: 'var(--text)' }}>
          {content || 'Could not generate digest. Try again.'}
        </div>
      )}
    </div>
  )
}
