'use client'

import { useEffect, useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setStreaming(false)

    const assistantIndex = next.length
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages(m => m.map((msg, i) => i === assistantIndex ? { ...msg, content: `Error: ${err}` } : msg))
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              setStreaming(true)
              setMessages(m =>
                m.map((msg, i) =>
                  i === assistantIndex ? { ...msg, content: msg.content + delta } : msg
                )
              )
            }
          } catch {}
        }
      }
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <span style={styles.headerTitle}>Jonathan AI</span>
        <span style={styles.headerSub}>Grounded in his recorded teachings</span>
      </header>

      <main style={styles.feed}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            Ask anything. Responses draw only from Jonathan&apos;s transcripts.
          </div>
        )}
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1
          const isThinking = loading && !streaming && isLast && m.role === 'assistant' && !m.content
          const isStreaming = loading && streaming && isLast && m.role === 'assistant'
          return (
            <div key={i} style={m.role === 'user' ? styles.userBubble : styles.aiBubble}>
              {isThinking ? (
                <span className="thinking-dots">
                  <span /><span /><span />
                </span>
              ) : (
                <>
                  {m.content}
                  {isStreaming && <span className="stream-cursor" />}
                </>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      <footer style={styles.footer}>
        <div style={styles.inputRow}>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask a question…"
            rows={1}
            disabled={loading}
          />
          <button style={{...styles.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1}} onClick={send} disabled={loading || !input.trim()}>
            {loading ? <span className="thinking-dots" style={{display:'flex',gap:2}}><span/><span/><span/></span> : '↑'}
          </button>
        </div>
        <p style={styles.privacy}>
          No messages are stored. Your input goes directly to the AI model — no database, no logs.
        </p>
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    maxWidth: 720,
    margin: '0 auto',
    width: '100%',
  },
  header: {
    padding: '16px 20px 14px',
    borderBottom: '1px solid #1e1e1e',
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: 17,
    color: '#f0f0f0',
  },
  headerSub: {
    fontSize: 12,
    color: '#555',
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  empty: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 60,
  },
  userBubble: {
    alignSelf: 'flex-end',
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 14px',
    maxWidth: '80%',
    whiteSpace: 'pre-wrap',
    color: '#d0d0f0',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    background: '#141414',
    border: '1px solid #222',
    borderRadius: '4px 18px 18px 18px',
    padding: '10px 14px',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
    color: '#e8e8e8',
    lineHeight: 1.7,
  },
  cursor: {
    animation: 'blink 1s step-end infinite',
  },
  footer: {
    borderTop: '1px solid #1e1e1e',
    padding: '12px 16px 16px',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: '10px 14px',
    color: '#e8e8e8',
    fontSize: 14,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  sendBtn: {
    width: 40,
    height: 40,
    background: '#2a2a6a',
    border: 'none',
    borderRadius: '50%',
    color: '#a0a0f0',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  privacy: {
    marginTop: 8,
    fontSize: 11,
    color: '#3a3a3a',
    textAlign: 'center',
  },
}
