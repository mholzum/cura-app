'use client'

import { useRef, useState } from 'react'
import type { Context } from '@/lib/types'

interface CaptureBoxProps {
  contexts: Context[]
  activeContextId: string | null
  onSetActiveContext: (id: string) => void
  onCapture: (content: string, screenshot: string | null, dueDate: string | null) => void
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

export default function CaptureBox({
  contexts,
  activeContextId,
  onSetActiveContext,
  onCapture,
}: CaptureBoxProps) {
  const [text, setText] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture()
  }

  function handleCapture() {
    if (!text.trim() && !screenshot) return
    const isoDate = dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : null
    onCapture(text.trim(), screenshot, isoDate)
    setText('')
    setScreenshot(null)
    setDueDate(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setScreenshot(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function toggleVoice() {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Voice capture not supported in this browser.')
      return
    }
    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    const base = text

    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (e: any) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setText(base + (base ? ' ' : '') + transcript)
    }
    recognition.onerror = () => { setIsRecording(false); recognitionRef.current = null }
    recognition.onend = () => { setIsRecording(false); recognitionRef.current = null }
    recognition.start()
  }

  return (
    <div className="mb-8">
      <div className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--muted)', fontSize: '11px' }}>
        // DUMP ANYTHING
      </div>
      <div
        className="rounded-sm border transition-colors p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <textarea
          rows={3}
          placeholder="Thought, link, idea, task — whatever's in your head."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none bg-transparent border-none p-0 text-base leading-relaxed"
          style={{ fontSize: '16px', lineHeight: '1.7' }}
        />

        {screenshot && (
          <div className="relative inline-block mt-3">
            <img src={screenshot} alt="screenshot" className="max-h-40 rounded-sm border" style={{ borderColor: 'var(--border)' }} />
            <button
              onClick={() => setScreenshot(null)}
              className="absolute top-1 right-1 font-mono text-xs px-1.5 py-0.5 rounded-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              ×
            </button>
          </div>
        )}

        <div
          className="flex items-center justify-between mt-4 pt-4 flex-wrap gap-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* Context tags */}
          <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            {contexts.map(ctx => (
              <button
                key={ctx.id}
                onClick={() => onSetActiveContext(ctx.id)}
                className="font-mono text-xs px-2.5 py-1 rounded-sm border transition-all flex-shrink-0"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  background: ctx.id === activeContextId ? 'var(--accent)' : 'transparent',
                  borderColor: ctx.id === activeContextId ? 'var(--accent)' : 'var(--border)',
                  color: ctx.id === activeContextId ? 'var(--bg)' : 'var(--muted)',
                }}
              >
                {ctx.name}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 items-center">
            {/* Due date */}
            {dueDate ? (
              <span
                className="font-mono flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-xs"
                style={{ fontSize: '10px', letterSpacing: '0.06em', background: 'rgba(200,160,80,0.08)', borderColor: 'rgba(200,160,80,0.3)', color: '#c8a050' }}
              >
                Due {formatShortDate(dueDate)}
                <button
                  onClick={() => setDueDate(null)}
                  className="leading-none ml-0.5"
                  style={{ color: 'var(--muted)' }}
                >
                  ×
                </button>
              </span>
            ) : (
              <label
                htmlFor="due-date-input"
                className="cursor-pointer rounded-sm border px-2.5 py-1.5 text-base leading-none transition-all"
                style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' }}
                title="Set due date"
              >
                📅
              </label>
            )}
            <input
              id="due-date-input"
              type="date"
              className="hidden"
              value={dueDate ?? ''}
              onChange={e => setDueDate(e.target.value || null)}
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer rounded-sm border px-2.5 py-1.5 text-base leading-none transition-all"
              style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              📎
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={toggleVoice}
              className="rounded-sm border px-2.5 py-1.5 text-base leading-none transition-all"
              style={{
                background: 'transparent',
                borderColor: isRecording ? 'var(--warn)' : 'var(--border)',
                color: isRecording ? 'var(--warn)' : 'var(--muted)',
                animation: isRecording ? 'micPulse 1s infinite' : 'none',
              }}
              title="Voice capture"
            >
              🎙
            </button>

            <button
              onClick={handleCapture}
              disabled={!text.trim() && !screenshot}
              className="font-display text-sm tracking-widest px-5 py-2 rounded-sm transition-all disabled:opacity-40"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              CAPTURE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
