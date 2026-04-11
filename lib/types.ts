export type Archetype = 'founder' | 'creator' | 'operator' | 'explorer'

export interface Context {
  id: string
  user_id: string
  name: string
  description: string
  created_at: string
}

export interface Capture {
  id: string
  user_id: string
  content: string
  context_id: string | null
  status: 'open' | 'stale' | 'closed'
  insight: string | null
  urgency: 'high' | 'normal' | 'low'
  created_at: string
  closed_at: string | null
  due_date: string | null
  screenshot?: string | null
  // joined
  context?: Context
}

export interface UserProfile {
  id: string
  archetype: Archetype | null
  created_at: string
}

export interface AIInsightResult {
  insight: string
  urgency: 'high' | 'normal' | 'low'
  suggestedContextName: string | null
}
