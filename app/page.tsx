'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LogoCenter } from '@/components/Logo'

const INVITE_CODE = 'CURA2026'
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function GatePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function checkSession() {
      if (DEV_MODE) {
        router.replace('/app')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('archetype')
          .eq('id', session.user.id)
          .single()

        if (profile?.archetype) {
          router.replace('/app')
        } else {
          router.replace('/onboarding')
        }
      } else {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim().toUpperCase() !== INVITE_CODE) {
      setError('invalid code')
      return
    }

    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInAnonymously()

    if (signInError) {
      setError('something went wrong. try again.')
      setSubmitting(false)
      return
    }

    router.replace('/onboarding')
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LogoCenter />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <LogoCenter />
        </div>

        <p className="font-mono text-xs tracking-widest mb-8 text-center" style={{ color: 'var(--muted)' }}>
          // your personal information system
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="ENTER INVITE CODE"
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            className="font-mono text-sm tracking-widest text-center uppercase"
            autoComplete="off"
            autoFocus
          />
          {error && (
            <p className="font-mono text-xs tracking-wider text-center" style={{ color: 'var(--warn)' }}>
              // {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full font-display text-lg tracking-widest py-3 rounded-sm transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {submitting ? 'ENTERING...' : 'ENTER →'}
          </button>
        </form>

        <p className="font-mono text-xs mt-6 text-center" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          // by invite only
        </p>
      </div>
    </div>
  )
}
