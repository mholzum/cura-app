'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LogoCenter } from '@/components/Logo'
import { processCapture, generateDigest, generateSmartPush, generateClosePush } from '@/lib/ai'
import type { Capture, Context } from '@/lib/types'
import Header from '@/components/Header'
import CaptureBox from '@/components/CaptureBox'
import CycleCard from '@/components/CycleCard'
import ContextManager from '@/components/ContextManager'
import WeeklyDigest from '@/components/WeeklyDigest'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const STALE_MS = 48 * 60 * 60 * 1000

const DEV_CONTEXTS: Context[] = [
  { id: 'dev-1', user_id: 'dev', name: 'Aphrodite',     description: '', created_at: new Date().toISOString() },
  { id: 'dev-2', user_id: 'dev', name: 'Feybl',         description: '', created_at: new Date().toISOString() },
  { id: 'dev-3', user_id: 'dev', name: 'Built to Last', description: '', created_at: new Date().toISOString() },
  { id: 'dev-4', user_id: 'dev', name: 'Cura',          description: '', created_at: new Date().toISOString() },
  { id: 'dev-5', user_id: 'dev', name: 'Old Town',      description: '', created_at: new Date().toISOString() },
  { id: 'dev-6', user_id: 'dev', name: 'POLLY',         description: '', created_at: new Date().toISOString() },
]

type Filter = 'all' | 'open' | 'stale' | 'closed'

export default function AppPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [contexts, setContexts] = useState<Context[]>([])
  const [captures, setCaptures] = useState<Capture[]>([])
  const [activeContextId, setActiveContextId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [contextFilter, setContextFilter] = useState<string | null>(null)
  const [instantInsight, setInstantInsight] = useState(false)
  const instantInsightRef = useRef(false)
  const [showContextManager, setShowContextManager] = useState(false)
  const [digestOpen, setDigestOpen] = useState(false)
  const [digestContent, setDigestContent] = useState<string | null>(null)
  const [digestLoading, setDigestLoading] = useState(false)
  const [pushMessage, setPushMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load ──────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      if (DEV_MODE) {
        setContexts(DEV_CONTEXTS)
        setActiveContextId(DEV_CONTEXTS[0].id)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) { router.replace('/'); return }

      setUserId(session.user.id)

      const [{ data: ctxData }, { data: capData }] = await Promise.all([
        supabase.from('contexts').select('*').eq('user_id', session.user.id).order('created_at'),
        supabase
          .from('captures')
          .select('*, context:contexts(*)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(200),
      ])

      const loadedContexts = ctxData ?? []
      const loadedCaptures = (capData ?? []) as Capture[]

      // Check migration offer
      const legacy = localStorage.getItem('cura_v2')
      if (legacy) {
        offerMigration(legacy, session.user.id, loadedContexts, loadedCaptures, supabase)
          .then(({ contexts: c, captures: cap }) => {
            setContexts(c)
            setCaptures(markStale(cap))
            setActiveContextId(c[0]?.id ?? null)
          })
      } else {
        setContexts(loadedContexts)
        setCaptures(markStale(loadedCaptures))
        setActiveContextId(loadedContexts[0]?.id ?? null)
      }

      setLoading(false)
    }
    init()
  }, [router])

  // ── Stale check ───────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setCaptures(prev => markStale(prev))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  // ── Smart push heartbeat ──────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const open = captures.filter(c => c.status !== 'closed')
      if (open.length === 0) return
      generateSmartPush(open).then(msg => { if (msg) showPush(msg) })
    }, 4 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [captures])

  // ── Push banner ───────────────────────────────────────────
  function showPush(message: string) {
    setPushMessage(message)
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => setPushMessage(null), 7000)
  }

  // ── Capture ───────────────────────────────────────────────
  async function handleCapture(content: string, screenshot: string | null) {
    if (!content && !screenshot) return

    const contextId = activeContextId
    const context = contexts.find(c => c.id === contextId) ?? null

    const now = new Date().toISOString()
    const tempId = `temp-${Date.now()}`

    const newCapture: Capture = {
      id: tempId,
      user_id: userId ?? 'dev',
      content,
      context_id: contextId,
      status: 'open',
      insight: null,
      urgency: 'normal',
      created_at: now,
      closed_at: null,
      context: context ?? undefined,
      ...(screenshot ? { screenshot } : {}),
    }

    setCaptures(prev => [newCapture, ...prev])

    if (!DEV_MODE && userId) {
      const supabase = createClient()
      const { data } = await supabase
        .from('captures')
        .insert({ user_id: userId, content, context_id: contextId, status: 'open', urgency: 'normal' })
        .select('*, context:contexts(*)')
        .single()

      if (data) {
        setCaptures(prev => prev.map(c => c.id === tempId ? (data as Capture) : c))
      }
    }

    if (instantInsightRef.current && content) {
      const open = captures.filter(c => c.status !== 'closed').slice(0, 10)
      const result = await processCapture(content, context?.name ?? '', open, contexts)
      if (result) {
        const suggestedCtx = result.suggestedContextName
          ? contexts.find(c => c.name === result.suggestedContextName)
          : null

        setCaptures(prev => prev.map(c => {
          if (c.id !== tempId && c.content !== content) return c
          return {
            ...c,
            insight: result.insight,
            urgency: result.urgency,
            context_id: suggestedCtx?.id ?? c.context_id,
            context: suggestedCtx ?? c.context,
          }
        }))

        if (!DEV_MODE && userId) {
          const supabase = createClient()
          const real = captures.find(c => c.content === content && c.user_id === userId)
          if (real && real.id !== tempId) {
            await supabase.from('captures').update({
              insight: result.insight,
              urgency: result.urgency,
              context_id: suggestedCtx?.id ?? contextId,
            }).eq('id', real.id)
          }
        }

        if (result.urgency === 'high') showPush(result.insight)
      }
    }
  }

  // ── Close cycle ───────────────────────────────────────────
  async function handleClose(id: string) {
    const capture = captures.find(c => c.id === id)
    if (!capture) return

    setCaptures(prev => prev.map(c => c.id === id ? { ...c, status: 'closed', closed_at: new Date().toISOString() } : c))

    if (!DEV_MODE && userId) {
      const supabase = createClient()
      await supabase.from('captures').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id)
    }

    const closedCount = captures.filter(c => c.status === 'closed').length + 1
    const msg = await generateClosePush(capture.content, capture.context?.name ?? '', closedCount)
    showPush(msg ?? `Cycle closed. ${closedCount} total.`)
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setCaptures(prev => prev.filter(c => c.id !== id))
    if (!DEV_MODE && userId) {
      const supabase = createClient()
      await supabase.from('captures').delete().eq('id', id)
    }
  }

  // ── Context manager ───────────────────────────────────────
  async function handleAddContext(name: string) {
    if (!DEV_MODE && userId) {
      const supabase = createClient()
      const { data } = await supabase
        .from('contexts')
        .insert({ user_id: userId, name, description: '' })
        .select()
        .single()
      if (data) setContexts(prev => [...prev, data as Context])
    } else {
      const newCtx: Context = { id: `dev-${Date.now()}`, user_id: 'dev', name, description: '', created_at: new Date().toISOString() }
      setContexts(prev => [...prev, newCtx])
    }
  }

  async function handleRemoveContext(id: string) {
    setContexts(prev => prev.filter(c => c.id !== id))
    if (activeContextId === id) setActiveContextId(contexts.find(c => c.id !== id)?.id ?? null)
    if (!DEV_MODE && userId) {
      const supabase = createClient()
      await supabase.from('contexts').delete().eq('id', id)
    }
  }

  async function handleUpdateDescription(id: string, description: string) {
    setContexts(prev => prev.map(c => c.id === id ? { ...c, description } : c))
    if (!DEV_MODE && userId) {
      const supabase = createClient()
      await supabase.from('contexts').update({ description }).eq('id', id)
    }
  }

  // ── Digest ────────────────────────────────────────────────
  async function handleDigest() {
    setDigestOpen(true)
    setDigestLoading(true)
    setDigestContent(null)
    const result = await generateDigest(captures, contexts)
    setDigestContent(result)
    setDigestLoading(false)
  }

  // ── Sign out ──────────────────────────────────────────────
  async function handleSignOut() {
    if (!DEV_MODE) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.replace('/')
  }

  // ── Derived ───────────────────────────────────────────────
  const openCount = captures.filter(c => c.status !== 'closed').length
  const closedCount = captures.filter(c => c.status === 'closed').length

  const contextOptions = Array.from(new Set(
    captures.filter(c => c.context).map(c => c.context!.name)
  ))

  const sortScore = (c: Capture) => {
    if (c.status === 'open' && c.urgency === 'high') return 0
    if (c.status === 'stale') return 1
    if (c.status === 'open') return 2
    return 3
  }

  const filtered = [...captures]
    .sort((a, b) => {
      const scoreDiff = sortScore(a) - sortScore(b)
      if (scoreDiff !== 0) return scoreDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !contextFilter || c.context?.name === contextFilter)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LogoCenter />
      </div>
    )
  }

  return (
    // Full-height column: fixed header, scrollable body
    <div className="h-full flex flex-col relative" style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* Fixed header */}
      <Header
        openCount={openCount}
        closedCount={closedCount}
        instantInsight={instantInsight}
        onToggleInsight={() => setInstantInsight(v => { instantInsightRef.current = !v; return !v })}
        onToggleContextManager={() => setShowContextManager(v => !v)}
      />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div className="px-4 pt-5 pb-10">

          {/* Context manager (slide-in below header) */}
          {showContextManager && (
            <ContextManager
              contexts={contexts}
              onAdd={handleAddContext}
              onRemove={handleRemoveContext}
              onUpdateDescription={handleUpdateDescription}
              onClose={() => setShowContextManager(false)}
            />
          )}

          {/* Capture box */}
          <CaptureBox
            contexts={contexts}
            activeContextId={activeContextId}
            onSetActiveContext={setActiveContextId}
            onCapture={handleCapture}
          />

          {/* Feed header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="font-display text-xl tracking-widest" style={{ color: 'var(--text)' }}>
              CYCLES
            </div>
            <div className="flex gap-1.5 items-center flex-wrap">
              <button
                onClick={handleDigest}
                className="font-mono px-2.5 py-1 rounded-sm border transition-all"
                style={{ fontSize: '10px', letterSpacing: '0.08em', background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                DIGEST
              </button>
              {(['all', 'open', 'stale', 'closed'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="font-mono px-2.5 py-1 rounded-sm border transition-all"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    background: 'transparent',
                    borderColor: filter === f ? 'var(--text)' : 'var(--border)',
                    color: filter === f ? 'var(--text)' : 'var(--muted)',
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Context filter row */}
          {contextOptions.length >= 2 && (
            <div
              className="flex gap-1.5 mb-4 overflow-x-auto"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}
            >
              <button
                onClick={() => setContextFilter(null)}
                className="font-mono px-2.5 py-1 rounded-sm text-xs flex-shrink-0 transition-all"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  background: 'transparent',
                  border: contextFilter === null ? '1px solid #c8a050' : '1px solid rgba(255,255,255,0.1)',
                  color: contextFilter === null ? '#c8a050' : 'rgba(255,255,255,0.35)',
                }}
              >
                ALL
              </button>
              {contextOptions.map(name => (
                <button
                  key={name}
                  onClick={() => setContextFilter(contextFilter === name ? null : name)}
                  className="font-mono px-2.5 py-1 rounded-sm text-xs flex-shrink-0 transition-all"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    background: 'transparent',
                    border: contextFilter === name ? '1px solid #c8a050' : '1px solid rgba(255,255,255,0.1)',
                    color: contextFilter === name ? '#c8a050' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {digestOpen && (
            <WeeklyDigest
              content={digestContent}
              loading={digestLoading}
              onClose={() => setDigestOpen(false)}
            />
          )}

          {/* Feed */}
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
              <div className="font-display text-6xl tracking-widest mb-4" style={{ opacity: 0.2 }}>∅</div>
              <p className="text-sm italic">
                {filter === 'all' ? 'Nothing captured yet. Drop something above.' : `No ${filter} cycles.`}
              </p>
            </div>
          ) : (
            filtered.map(c => (
              <CycleCard key={c.id} capture={c} onClose={handleClose} onDelete={handleDelete} />
            ))
          )}

        </div>
      </div>

      {/* Push banner */}
      {pushMessage && (
        <div
          className="absolute bottom-6 left-1/2 flex items-center gap-3 px-5 py-3 rounded-sm border"
          style={{
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '520px',
            background: 'var(--surface)',
            borderColor: 'var(--accent)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 50,
            animation: 'bannerIn 0.3s ease',
          }}
        >
          <span>⚡</span>
          <span className="flex-1 text-sm italic" style={{ color: 'var(--text)' }}>{pushMessage}</span>
          <button onClick={() => setPushMessage(null)} className="text-lg leading-none" style={{ color: 'var(--muted)' }}>×</button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────
function markStale(captures: Capture[]): Capture[] {
  return captures.map(c => {
    if (c.status === 'open' && Date.now() - new Date(c.created_at).getTime() > STALE_MS) {
      return { ...c, status: 'stale' as const }
    }
    return c
  })
}

async function offerMigration(
  legacy: string,
  userId: string,
  existingContexts: Context[],
  existingCaptures: Capture[],
  supabase: ReturnType<typeof createClient>
): Promise<{ contexts: Context[]; captures: Capture[] }> {
  try {
    const parsed = JSON.parse(legacy)
    const hasItems = parsed.items?.length > 0

    if (!hasItems) {
      localStorage.removeItem('cura_v2')
      return { contexts: existingContexts, captures: existingCaptures }
    }

    const confirmed = window.confirm(
      `Found ${parsed.items.length} captures in your old Cura data. Import them?`
    )

    if (!confirmed) {
      localStorage.removeItem('cura_v2')
      return { contexts: existingContexts, captures: existingCaptures }
    }

    // Insert legacy captures (no context association — contexts changed)
    const legacyInserts = parsed.items.map((item: any) => ({
      user_id: userId,
      content: item.content ?? '',
      context_id: null,
      status: item.status ?? 'open',
      insight: item.insight ?? null,
      urgency: item.urgency ?? 'normal',
      created_at: new Date(item.createdAt ?? Date.now()).toISOString(),
      closed_at: item.status === 'closed' ? new Date(item.updatedAt ?? Date.now()).toISOString() : null,
    }))

    const { data: imported } = await supabase
      .from('captures')
      .insert(legacyInserts)
      .select('*, context:contexts(*)')

    localStorage.removeItem('cura_v2')

    return {
      contexts: existingContexts,
      captures: markStale([...(imported as Capture[] ?? []), ...existingCaptures]),
    }
  } catch {
    localStorage.removeItem('cura_v2')
    return { contexts: existingContexts, captures: existingCaptures }
  }
}
