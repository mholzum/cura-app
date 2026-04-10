'use client'

import { useState } from 'react'
import type { Context } from '@/lib/types'

interface ContextManagerProps {
  contexts: Context[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onUpdateDescription: (id: string, description: string) => void
  onClose: () => void
}

export default function ContextManager({
  contexts,
  onAdd,
  onRemove,
  onUpdateDescription,
  onClose,
}: ContextManagerProps) {
  const [newCtx, setNewCtx] = useState('')

  function handleAdd() {
    const val = newCtx.trim()
    if (!val || contexts.find(c => c.name === val)) return
    onAdd(val)
    setNewCtx('')
  }

  return (
    <div
      className="rounded-sm border p-6 mb-6"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', animation: 'slideIn 0.2s ease' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl tracking-widest" style={{ color: 'var(--accent)' }}>
          CONTEXTS
        </h2>
        <button
          onClick={onClose}
          className="font-mono text-lg leading-none"
          style={{ color: 'var(--muted)' }}
        >
          ×
        </button>
      </div>
      <p className="font-mono text-xs mb-5" style={{ color: 'var(--muted)', fontSize: '11px' }}>
        // the worlds you're running. everything gets filtered through these.
      </p>

      <div className="space-y-2 mb-4">
        {contexts.map(ctx => (
          <div key={ctx.id} className="rounded-sm border p-3" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--accent)', fontSize: '11px' }}>
                {ctx.name}
              </span>
              <button
                onClick={() => onRemove(ctx.id)}
                className="font-mono text-sm leading-none transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--warn)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                ×
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="Describe this world in 1-2 sentences..."
              value={ctx.description}
              onChange={e => onUpdateDescription(ctx.id, e.target.value)}
              className="font-mono resize-none bg-transparent border-none p-0"
              style={{ fontSize: '11px', height: '48px', color: 'var(--muted)' }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a context..."
          value={newCtx}
          onChange={e => setNewCtx(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          maxLength={30}
        />
        <button
          onClick={handleAdd}
          disabled={!newCtx.trim()}
          className="font-display text-sm tracking-widest px-4 rounded-sm disabled:opacity-40 whitespace-nowrap"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          ADD
        </button>
      </div>
    </div>
  )
}
