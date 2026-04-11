import type { Capture, Context, AIInsightResult } from './types'

const PROXY_URL = 'https://mgxhxilarhtfibjtwpbc.supabase.co/functions/v1/anthropic-proxy'
const CURA_SECRET = process.env.NEXT_PUBLIC_CURA_SECRET || 'cura-proxy-secret-2026'

async function callClaude(system: string, userMessage: string, maxTokens = 400): Promise<string | null> {
  console.log('[callClaude] firing POST to', PROXY_URL, '| secret present:', !!CURA_SECRET)
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cura-secret': CURA_SECRET,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })
    console.log('[callClaude] response status:', res.status, res.statusText)
    if (!res.ok) {
      const errText = await res.text()
      console.error('[callClaude] non-OK response body:', errText)
      return null
    }
    const data = await res.json()
    console.log('[callClaude] parsed response:', JSON.stringify(data).slice(0, 200))
    return data?.content?.[0]?.text || null
  } catch (err) {
    console.error('[callClaude] fetch threw:', err)
    return null
  }
}

function buildContextBlock(contexts: Context[]): string {
  return contexts
    .map(c => (c.description ? `- ${c.name}: ${c.description}` : `- ${c.name}`))
    .join('\n')
}

export async function processCapture(
  content: string,
  contextName: string,
  openCycles: Capture[],
  userContexts: Context[]
): Promise<AIInsightResult | null> {
  console.log('[processCapture] called | content:', content.slice(0, 60), '| context:', contextName)
  const openItems = openCycles
    .slice(0, 10)
    .map(i => `- [${i.context?.name ?? ''}] ${i.content} (${formatAge(i.created_at)})`)
    .join('\n')

  const system = `You are Cura — a brutally honest thinking partner, not an assistant. You see what the user can't see about themselves.

The user's active worlds:
${buildContextBlock(userContexts)}

Your job: read this capture and say the one true thing about it. Not a summary. Not encouragement. The thing they probably already know but haven't said out loud. What does this reveal about where they actually are right now? What's the real action hiding inside it?

One sentence. Max 20 words. Direct. Occasionally uncomfortable. Never generic.

Return a JSON object with exactly these fields:
- insight: your one sentence (max 20 words)
- urgency: "high", "normal", or "low"
- suggestedContextName: which of their world names this belongs to most (exact name match, or null)

Return ONLY valid JSON. No markdown, no code fences, no preamble.`

  const userMsg = `New capture: "${content}"
Context tagged: ${contextName}
Their other open cycles:\n${openItems || 'none yet'}`

  const response = await callClaude(system, userMsg)
  console.log('[processCapture] raw response:', response)
  if (!response) {
    console.error('[processCapture] callClaude returned null')
    return null
  }

  try {
    const clean = response.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(clean)
    console.log('[processCapture] parsed result:', parsed)
    return {
      insight: parsed.insight || '',
      urgency: parsed.urgency || 'normal',
      suggestedContextName: parsed.suggestedContextName || null,
    }
  } catch (err) {
    console.error('[processCapture] JSON parse failed:', err, '| raw:', response)
    return null
  }
}

export async function organizeBrainDump(
  dump: string
): Promise<{ contexts: { name: string; description: string }[]; captures: { content: string; contextName: string }[] } | null> {
  const system = `You are organizing someone's brain dump into a personal knowledge system. Extract: 1) The distinct 'worlds' or contexts they're running (projects, relationships, areas of life). 2) Individual captures — specific tasks, worries, ideas, goals. Return ONLY valid JSON, no markdown:
{
  "contexts": [{"name": string, "description": string}],
  "captures": [{"content": string, "contextName": string}]
}
Max 8 contexts. Context descriptions should be 1-2 sentences capturing what this world is and what's at stake. Be specific, not generic.`

  const response = await callClaude(system, dump, 2000)
  if (!response) return null
  try {
    const clean = response.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

export async function generateDigest(
  captures: Capture[],
  contexts: Context[]
): Promise<string | null> {
  const open = captures.filter(i => i.status === 'open')
  const stale = captures.filter(i => i.status === 'stale')
  const closed = captures.filter(i => i.status === 'closed')

  const itemsSummary = captures
    .slice(0, 50)
    .map(i => `[${i.status.toUpperCase()}][${i.context?.name ?? ''}] ${i.content} — captured ${formatAge(i.created_at)}`)
    .join('\n')

  const system = `You are Cura — a wise executive assistant who has been watching this person's information patterns. You are honest, direct, and occasionally uncomfortable when the truth requires it. You do not flatter. You do not hedge. You see patterns humans miss about themselves.

Generate a weekly digest. Be a mirror, not a cheerleader. Point to the patterns. Name what they've been avoiding. Celebrate what they actually closed. Tell them what the data says about where their real energy is going versus where they say it's going.

Write in second person. Short paragraphs. Direct sentences. No bullet points. Max 200 words. Only reference what is explicitly in the captures provided. Do not infer, invent, or assume context that isn't present in the data. If something isn't there, don't mention it.`

  const userMsg = `Here are their cycles from the past week:
Contexts:
${buildContextBlock(contexts)}
Open: ${open.length} | Stale: ${stale.length} | Closed: ${closed.length}

All items:
${itemsSummary}`

  return callClaude(system, userMsg)
}

export async function generateSmartPush(openCaptures: Capture[]): Promise<string | null> {
  if (openCaptures.length === 0) return null

  const staleCount = openCaptures.filter(i => i.status === 'stale').length
  const itemsSummary = openCaptures
    .slice(0, 8)
    .map(i => `[${i.context?.name ?? ''}] ${i.content} (${formatAge(i.created_at)})`)
    .join('\n')

  const system = `You are Cura pushing back at someone who hasn't checked in for a while. You've been watching their open cycles. Pick the one thing most worth their attention right now and tell them why — specifically, wisely. One sentence. Direct. No fluff. Max 20 words.`

  return callClaude(system, `Open cycles:\n${itemsSummary}\nStale count: ${staleCount}`)
}

export async function generateClosePush(
  closedContent: string,
  closedContextName: string,
  totalClosed: number
): Promise<string | null> {
  const system = `You are Cura. Someone just closed a cycle. Give them one sentence of acknowledgment. Be real, not cheerleader-ish. Reference what they closed if it's interesting. Max 15 words. No quotes around your response.`
  return callClaude(
    system,
    `They just closed: "${closedContent}" (${closedContextName}). Total closed: ${totalClosed}.`
  )
}

function formatAge(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}
