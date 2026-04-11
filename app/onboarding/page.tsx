'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { organizeBrainDump } from '@/lib/ai'
import { LogoCenter } from '@/components/Logo'
import type { Archetype } from '@/lib/types'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

const ARCHETYPES: Record<Archetype, { label: string; hint: string; contexts: string[] }> = {
  founder: {
    label: 'FOUNDER',
    hint: 'Building a company or product',
    contexts: ['Company', 'Product', 'Revenue', 'Team', 'Personal'],
  },
  creator: {
    label: 'CREATOR',
    hint: 'Making content, art, or media',
    contexts: ['Projects', 'Audience', 'Revenue', 'Creative', 'Personal'],
  },
  operator: {
    label: 'OPERATOR',
    hint: 'Running systems, teams, or operations',
    contexts: ['Work', 'Projects', 'Finance', 'Home', 'Personal'],
  },
  explorer: {
    label: 'EXPLORER',
    hint: 'Figuring it out',
    contexts: ['Projects', 'Learning', 'Finance', 'Relationships', 'Personal'],
  },
}

const DEV_CONTEXTS = ['Aphrodite', 'Feybl', 'Built to Last', 'Cura', 'Old Town', 'POLLY']

type Step = 'archetype' | 'dump' | 'organizing' | 'contexts'

interface PendingCapture {
  content: string
  contextName: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('archetype')
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null)
  const [contexts, setContexts] = useState<{ name: string; description: string }[]>([])
  const [pendingCaptures, setPendingCaptures] = useState<PendingCapture[]>([])
  const [dump, setDump] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [organizeError, setOrganizeError] = useState(false)
  const [newCtx, setNewCtx] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    async function init() {
      if (DEV_MODE) {
        setContexts(DEV_CONTEXTS.map(name => ({ name, description: '' })))
        setStep('contexts')
        setChecking(false)
        return
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/')
        return
      }

      const { data: profile } = await supabase
        .from('users_profile')
        .select('archetype')
        .eq('id', session.user.id)
        .single()

      if (profile?.archetype) {
        router.replace('/app')
        return
      }

      setChecking(false)
    }
    init()
  }, [router])

  function selectArchetype(archetype: Archetype) {
    setSelectedArchetype(archetype)
    setStep('dump')
  }

  function skipToManual() {
    if (selectedArchetype) {
      setContexts(ARCHETYPES[selectedArchetype].contexts.map(name => ({ name, description: '' })))
    }
    setStep('contexts')
  }

  function toggleVoice() {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition
    const base = dump
    recognition.onstart = () => setIsRecording(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setDump(base + (base ? ' ' : '') + transcript)
    }
    recognition.onerror = () => { setIsRecording(false); recognitionRef.current = null }
    recognition.onend = () => { setIsRecording(false); recognitionRef.current = null }
    recognition.start()
  }

  async function handleOrganize() {
    if (!dump.trim()) return
    setOrganizeError(false)
    setStep('organizing')
    const result = await organizeBrainDump(dump.trim())
    if (!result || result.contexts.length === 0) {
      setOrganizeError(true)
      setStep('dump')
      return
    }
    setContexts(result.contexts)
    setPendingCaptures(result.captures ?? [])
    setStep('contexts')
  }

  function addContext() {
    const val = newCtx.trim()
    if (!val || contexts.find(c => c.name === val)) return
    setContexts(prev => [...prev, { name: val, description: '' }])
    setNewCtx('')
  }

  function removeContext(name: string) {
    setContexts(prev => prev.filter(c => c.name !== name))
  }

  function updateDescription(name: string, description: string) {
    setContexts(prev => prev.map(c => c.name === name ? { ...c, description } : c))
  }

  async function handleStart() {
    if (contexts.length === 0) return
    setSaving(true)

    if (DEV_MODE) {
      router.replace('/app')
      return
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/'); return }

    const userId = session.user.id

    await supabase.from('users_profile').upsert({
      id: userId,
      archetype: selectedArchetype,
    })

    const { data: savedContexts } = await supabase
      .from('contexts')
      .insert(contexts.map(c => ({ user_id: userId, name: c.name, description: c.description })))
      .select()

    if (savedContexts && pendingCaptures.length > 0) {
      const ctxMap = new Map((savedContexts as { id: string; name: string }[]).map(c => [c.name, c.id]))
      await supabase.from('captures').insert(
        pendingCaptures.map(cap => ({
          user_id: userId,
          content: cap.content,
          context_id: ctxMap.get(cap.contextName) ?? null,
          status: 'open',
          urgency: 'normal',
        }))
      )
    }

    router.replace('/app')
  }

  if (checking) {
    return (
      <div className="h-full flex items-center justify-center">
        <LogoCenter />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">

        {/* ── ARCHETYPE ── */}
        {step === 'archetype' && (
          <div style={{ animation: 'slideIn 0.25s ease' }}>
            <h2 className="font-display text-3xl tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
              WHAT ARE YOU?
            </h2>
            <p className="font-mono text-xs mb-8" style={{ color: 'var(--muted)' }}>
              // pick the frame that fits closest. you can edit everything after.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(ARCHETYPES) as [Archetype, typeof ARCHETYPES[Archetype]][]).map(([key, a]) => (
                <button
                  key={key}
                  onClick={() => selectArchetype(key)}
                  className="text-left p-5 rounded-sm border transition-all"
                  style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <span className="font-display text-xl tracking-widest block" style={{ color: 'var(--text)' }}>
                    {a.label}
                  </span>
                  <span className="font-mono text-xs block mt-1" style={{ color: 'var(--muted)' }}>
                    {a.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── BRAIN DUMP ── */}
        {step === 'dump' && (
          <div style={{ animation: 'slideIn 0.25s ease' }}>
            <h2 className="font-display text-3xl tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
              WHAT'S ON YOUR MIND?
            </h2>
            <p className="font-mono text-xs mb-6" style={{ color: 'var(--muted)' }}>
              // projects, goals, worries, dreams, things undone — all of it. the more you give, the sharper cura gets.
            </p>

            {organizeError && (
              <p className="font-mono text-xs mb-4" style={{ color: 'var(--warn)' }}>
                // couldn't parse that — try again or add more detail.
              </p>
            )}

            <div className="rounded-sm border p-4 mb-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <textarea
                rows={6}
                placeholder="Start talking or typing. Don't filter. Go."
                value={dump}
                onChange={e => setDump(e.target.value)}
                className="resize-none bg-transparent border-none p-0 text-base leading-relaxed"
                style={{ fontSize: '16px', lineHeight: '1.7', minHeight: '144px' }}
                autoFocus
              />
            </div>

            <button
              onClick={toggleVoice}
              className="w-full font-mono text-sm py-3 rounded-sm border mb-3 transition-all"
              style={{
                background: 'transparent',
                borderColor: isRecording ? 'var(--warn)' : 'var(--border)',
                color: isRecording ? 'var(--warn)' : 'var(--muted)',
                letterSpacing: '0.08em',
                animation: isRecording ? 'micPulse 1s infinite' : 'none',
              }}
            >
              {isRecording ? '🎙 RECORDING — TAP TO STOP' : '🎙 SPEAK INSTEAD'}
            </button>

            <button
              onClick={handleOrganize}
              disabled={!dump.trim()}
              className="w-full font-display text-lg tracking-widest py-3 rounded-sm transition-all disabled:opacity-40 mb-3"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              ORGANIZE IT →
            </button>

            <p className="font-mono text-xs text-center mb-6" style={{ color: 'var(--muted)', opacity: 0.5 }}>
              // takes about 10 seconds
            </p>

            <div className="text-center">
              <button
                onClick={skipToManual}
                className="font-mono text-xs transition-colors"
                style={{ color: 'var(--muted)', opacity: 0.5 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
              >
                // skip — I'll add manually
              </button>
            </div>
          </div>
        )}

        {/* ── ORGANIZING ── */}
        {step === 'organizing' && (
          <div className="text-center py-16" style={{ animation: 'slideIn 0.25s ease' }}>
            <div className="flex justify-center mb-8" style={{ opacity: 0.6 }}>
              <LogoCenter />
            </div>
            <div
              className="font-mono text-sm"
              style={{ color: 'var(--muted)', animation: 'micPulse 1.5s infinite', letterSpacing: '0.1em' }}
            >
              // reading your mind...
            </div>
          </div>
        )}

        {/* ── CONFIRM CONTEXTS ── */}
        {step === 'contexts' && (
          <div style={{ animation: 'slideIn 0.25s ease' }}>
            <h2 className="font-display text-3xl tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
              YOUR WORLDS
            </h2>
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>
              // cura found these contexts. edit, remove, or add your own.
            </p>
            {pendingCaptures.length > 0 && (
              <p className="font-mono text-xs mb-6" style={{ color: 'var(--open)' }}>
                // found {pendingCaptures.length} open cycle{pendingCaptures.length !== 1 ? 's' : ''} — they'll be waiting in your feed
              </p>
            )}

            <div className="space-y-2 mb-4">
              {contexts.map(ctx => (
                <div key={ctx.name} className="rounded-sm border p-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--accent)' }}>
                      {ctx.name}
                    </span>
                    <button
                      onClick={() => removeContext(ctx.name)}
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
                    onChange={e => updateDescription(ctx.name, e.target.value)}
                    className="font-mono text-xs resize-none"
                    style={{ fontSize: '11px', height: '48px' }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Add a context..."
                value={newCtx}
                onChange={e => setNewCtx(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addContext()}
                maxLength={30}
              />
              <button
                onClick={addContext}
                disabled={!newCtx.trim()}
                className="font-display text-sm tracking-widest px-4 rounded-sm disabled:opacity-40 whitespace-nowrap"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                ADD
              </button>
            </div>

            <div className="flex gap-3">
              {!DEV_MODE && (
                <button
                  onClick={() => setStep('dump')}
                  className="font-display text-sm tracking-widest px-4 py-3 rounded-sm"
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}
                >
                  ← BACK
                </button>
              )}
              <button
                onClick={handleStart}
                disabled={saving || contexts.length === 0}
                className="flex-1 font-display text-lg tracking-widest py-3 rounded-sm transition-all disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                {saving ? 'SAVING...' : 'LOOKS RIGHT →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
