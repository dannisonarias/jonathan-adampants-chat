import { NextRequest } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/corpus'

export const runtime = 'nodejs'
// Increase timeout for large context payloads
export const maxDuration = 60

type Message = { role: 'user' | 'assistant' | 'system'; content: string }

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: Message[] }

  const ollamaUrl = process.env.OLLAMA_BASE_URL
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2'
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const openrouterModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash'

  if (!ollamaUrl && !openrouterKey) {
    return new Response('No API key configured. Set OPENROUTER_API_KEY or OLLAMA_BASE_URL.', { status: 500 })
  }

  const payload = {
    model: ollamaUrl ? ollamaModel : openrouterModel,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
  }

  const endpoint = ollamaUrl
    ? `${ollamaUrl}/v1/chat/completions`
    : 'https://openrouter.ai/api/v1/chat/completions'

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!ollamaUrl && openrouterKey) {
    headers['Authorization'] = `Bearer ${openrouterKey}`
  }

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!upstream.ok) {
    const err = await upstream.text()
    return new Response(`Upstream error: ${err}`, { status: upstream.status })
  }

  // Pipe the SSE stream directly to the client
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
