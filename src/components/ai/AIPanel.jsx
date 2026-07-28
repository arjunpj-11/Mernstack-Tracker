import { useCallback, useEffect, useRef, useState } from 'react'
import { renderMarkdown } from '../../utils/markdownRenderer'
import { studyNotesPrompt } from '../../utils/aiPrompts'
import AIChat from './AIChat'

export default function AIPanel({ open, topic, onClose, ai }) {
  const [tab, setTab] = useState('notes')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const startedRef = useRef(false)

  const fetchNotes = useCallback(() => {
    if (!topic) return

    setLoading(true)
    setContent('')
    setError(null)

    ai.streamResponse(
      studyNotesPrompt(topic.label, topic.context),
      setContent,
      () => setLoading(false),
      (streamError) => {
        setLoading(false)
        setError(streamError)
      }
    )
  }, [ai, topic])

  useEffect(() => {
    if (!open || !topic || startedRef.current) return

    startedRef.current = true
    ai.streamResponse(
      studyNotesPrompt(topic.label, topic.context),
      setContent,
      () => setLoading(false),
      (streamError) => {
        setLoading(false)
        setError(streamError)
      }
    )
  }, [ai, open, topic])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleTabChange = (newTab) => {
    setTab(newTab)
    if (newTab === 'notes' && !content && !loading) {
      fetchNotes()
    }
  }

  const errorMessage = (err) => {
    if (err === 'no_key')
      return {
        icon: '🔑',
        title: 'API Key Required',
        msg: 'Add your free Groq API key to generate AI study notes.'
      }
    if (err === 'invalid_key')
      return {
        icon: '🔑',
        title: 'Invalid API Key',
        msg: 'Your key was rejected. Please check and update it.'
      }
    if (err === 'rate_limit')
      return {
        icon: '⏳',
        title: 'Rate Limit',
        msg: 'Free tier limit reached. Wait a moment and regenerate.'
      }
    return { icon: '⚠️', title: 'Error', msg: err }
  }

  return (
    <>
      <div
        className={`ai-panel-backdrop ${open ? 'visible' : ''}`}
        onClick={onClose}
      />
      <div
        className={`ai-panel ${open ? 'open' : ''}`}
        aria-hidden={!open}
        inert={!open}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <div className="ai-panel-header" style={{ flexShrink: 0 }}>
          <div className="ai-panel-icon">✦</div>
          <div className="ai-panel-title-wrap">
            <div className="ai-panel-topic">
              {topic?.label || 'AI Study Notes'}
            </div>
            <div className="ai-panel-sub">{topic?.context || ''}</div>
          </div>
          <button className="ai-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ai-panel-tabs" style={{ flexShrink: 0 }}>
          <button
            className={`ai-tab ${tab === 'notes' ? 'active' : ''}`}
            onClick={() => handleTabChange('notes')}
          >
            📖 Study Notes
          </button>
          <button
            className={`ai-tab ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            💬 Ask Doubts
          </button>
        </div>

        {tab === 'notes' ? (
          <>
            <div
              className="ai-panel-body"
              style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
            >
              {loading && !content && (
                <div className="ai-loading">
                  <div className="ai-loading-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="ai-loading-text">Generating study notes…</div>
                </div>
              )}
              {error && !content && (
                <div className="ai-error">
                  <div className="ai-error-icon">
                    {errorMessage(error).icon}
                  </div>
                  <strong>{errorMessage(error).title}</strong>
                  <br />
                  <br />
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {errorMessage(error).msg}
                  </span>
                </div>
              )}
              {content && (
                <div
                  className="ai-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      renderMarkdown(content) +
                      (loading ? '<span class="ai-cursor"></span>' : '')
                  }}
                />
              )}
            </div>
            <div className="ai-panel-footer" style={{ flexShrink: 0 }}>
              <span className="ai-footer-note">
                ⚡ Powered by Groq · llama-3.3-70b
              </span>
              <button className="ai-regen-btn" onClick={fetchNotes}>
                ↻ Regenerate
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <AIChat topic={topic} ai={ai} />
          </div>
        )}
      </div>
    </>
  )
}
