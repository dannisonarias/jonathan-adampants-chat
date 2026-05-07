'use client'

import { useEffect, useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string; isError?: boolean }

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendText(text: string) {
    if (!text || loading) return
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
        setMessages(m => m.map((msg, i) => i === assistantIndex ? { ...msg, content: `Error: ${err}`, isError: true } : msg))
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
              setMessages(m => m.map((msg, i) => i === assistantIndex ? { ...msg, content: msg.content + delta } : msg))
            }
          } catch {}
        }
      }
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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
        setMessages(m => m.map((msg, i) => i === assistantIndex ? { ...msg, content: `Error: ${err}`, isError: true } : msg))
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
          <div style={{ ...styles.empty, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span>Ask anything. Responses draw only from Jonathan&apos;s transcripts.</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 400 }}>
              {[
                "What does Jonathan say about fear?",
                "How does Jonathan describe the nature of God?",
                "What is Jonathan's teaching on prayer?",
              ].map((q, i) => (
                <StarterChip key={i} text={q} onSend={sendText} disabled={loading} />
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1
          const isThinking = loading && !streaming && isLast && m.role === 'assistant' && !m.content
          const isStreaming = loading && streaming && isLast && m.role === 'assistant'
          if (m.role === 'assistant') {
            return (
              <div
                key={i}
                style={{ position: 'relative', alignSelf: 'flex-start', maxWidth: '85%' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div style={m.isError ? styles.errorBubble : styles.aiBubble}>
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
                  {m.isError && (
                    <button
                      style={styles.retryBtn}
                      onClick={() => {
                        const userMsg = messages[i - 1]
                        if (userMsg) {
                          setMessages(prev => prev.filter((_, idx) => idx !== i && idx !== i - 1))
                          setInput(userMsg.content)
                        }
                      }}
                    >
                      Retry
                    </button>
                  )}
                </div>
                {!m.isError && !isStreaming && !isThinking && hoveredIndex === i && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content)
                      setCopiedIndex(i)
                      setTimeout(() => setCopiedIndex(c => c === i ? null : c), 1500)
                    }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'transparent',
                      border: '1px solid #333',
                      borderRadius: 4,
                      color: '#555',
                      fontSize: 11,
                      padding: '2px 6px',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                  >
                    {copiedIndex === i ? '✓' : '⎘'}
                  </button>
                )}
              </div>
            )
          }
          return (
            <div key={i} style={styles.userBubble}>
              {m.content}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      <footer style={styles.footer}>
        <div style={styles.inputRow}>
          <textarea
            ref={textareaRef}
            style={{...styles.textarea, maxHeight: 160, overflowY: 'auto'}}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask a question…"
            disabled={loading}
          />
          <button style={{...styles.sendBtn, opacity: loading || !input.trim() ? 0.4 : 1}} onClick={send} disabled={loading || !input.trim()}>
            {loading ? <span className="thinking-dots" style={{display:'flex',gap:2}}><span/><span/><span/></span> : '↑'}
          </button>
        </div>
        <p style={styles.privacy}>
          No messages stored. Responses are grounded only in Jonathan&apos;s recorded teachings.{' '}
          <a
            href="https://github.com/dannisonarias/jonathan-adampants-chat"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.sourceLink}
          >
            Open source
          </a>
          {' '}— see exactly how it works.{' '}
          <a
            href="https://archive.org/details/JonathanadampantsCollection/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.sourceLink}
          >
            Listen to the recordings
          </a>
          {' '}on Internet Archive.
        </p>
      </footer>
    </div>
  )
}

function StarterChip({ text, onSend, disabled }: { text: string; onSend: (t: string) => void; disabled: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => onSend(text)}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#222' : '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 20,
        padding: '7px 14px',
        color: hovered ? '#888' : '#666',
        fontSize: 13,
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        lineHeight: 1.4,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {text}
    </button>
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
  errorBubble: {
    alignSelf: 'flex-start',
    background: '#1a0a0a',
    border: '1px solid #3a1a1a',
    borderRadius: '4px 18px 18px 18px',
    padding: '10px 14px',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
    color: '#cc6666',
    lineHeight: 1.7,
  },
  retryBtn: {
    background: 'transparent',
    border: '1px solid #3a3a3a',
    borderRadius: 4,
    color: '#666',
    fontSize: 11,
    padding: '3px 8px',
    cursor: 'pointer',
    marginTop: 6,
    display: 'block',
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
  sourceLink: {
    color: '#555',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
}
