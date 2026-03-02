'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getStickyNotes, addStickyNote, deleteStickyNote } from '@/lib/api/sticky-notes'

type Note = { id: string; content: string }

export default function StickyNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showInput, setShowInput] = useState(false)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const data = await getStickyNotes()
      setNotes(data ?? [])
    } catch {
      setNotes([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-focus input when shown
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  const handleAdd = async () => {
    if (!text.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await addStickyNote(text.trim())
      setText('')
      setShowInput(false)
      await load()
    } catch (err) {
      console.error('便签添加失败:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteStickyNote(id)
      await load()
    } catch {
      // Silently handle error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setShowInput(false)
      setText('')
    }
  }

  return (
    <div>
      <div className="sec-head">
        <div className="sec-dot honey" />
        <div className="sec-name">{'\u4FBF\u7B7E\u63D0\u9192'}</div>
      </div>
      <div className="float-card glow-neutral">
        {notes.map(note => (
          <div key={note.id} className="note-item" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div className="note-dot" />
              <span>{note.content}</span>
            </div>
            <button
              onClick={() => handleDelete(note.id)}
              aria-label={'\u5220\u9664\u4FBF\u7B7E'}
              className="note-delete"
            >
              {'\u00D7'}
            </button>
          </div>
        ))}

        {notes.length === 0 && !showInput && (
          <div className="note-empty">
            {'\u8FD8\u6CA1\u6709\u4FBF\u7B7E'}
          </div>
        )}

        {showInput && (
          <div className="note-input-row" style={{ marginTop: notes.length > 0 ? 12 : 0, alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder={'\u5199\u70B9\u4EC0\u4E48...'}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="field-input"
              style={{
                flex: 1,
                fontSize: 13,
                padding: '8px 12px',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={isSubmitting || !text.trim()}
              className="note-submit"
            >
              {'\u6DFB\u52A0'}
            </button>
          </div>
        )}

        {!showInput && (
          <div
            className="note-add"
            onClick={() => setShowInput(true)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') setShowInput(true) }}
          >
            + {'\u6DFB\u52A0\u4FBF\u7B7E'}
          </div>
        )}
      </div>
    </div>
  )
}
