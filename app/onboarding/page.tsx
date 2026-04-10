'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'archetype' | 'contexts'>('archetype')
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null)
  const [contexts, setContexts] = useState<{ name: string; description: string }[]>([])
  const [newCtx, setNewCtx] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)

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

      // Already done onboarding?
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
    setContexts(ARCHETYPES[archetype].contexts.map(name => ({ name, description: '' })))
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

    // Save profile
    await supabase.from('users_profile').upsert({
      id: userId,
      archetype: selectedArchetype,
    })

    // Save contexts
    await supabase.from('contexts').insert(
      contexts.map(c => ({ user_id: userId, name: c.name, description: c.description }))
    )

    router.replace('/app')
  }

  if (checking) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="font-display text-2xl tracking-widest" style={{ color: 'var(--muted)' }}>
          CURA
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">

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

        {step === 'contexts' && (
          <div style={{ animation: 'slideIn 0.25s ease' }}>
            <h2 className="font-display text-3xl tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
              YOUR CONTEXTS
            </h2>
            <p className="font-mono text-xs mb-8" style={{ color: 'var(--muted)' }}>
              // what worlds are you running right now? edit, remove, or add your own.
            </p>

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

            <div className="flex gap-2 mb-8">
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
                  onClick={() => setStep('archetype')}
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
                {saving ? 'SAVING...' : 'START →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
