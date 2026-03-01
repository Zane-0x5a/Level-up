'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { getStickyNotes, addStickyNote, deleteStickyNote } from '@/lib/api/sticky-notes'

type Note = { id: string; content: string }

export default function StickyNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showInput, setShowInput] = useState(false)
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    const data = await getStickyNotes()
    setNotes(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!text.trim()) return
    await addStickyNote(text.trim())
    setText('')
    setShowInput(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await deleteStickyNote(id)
    load()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <section className="space-y-3 animate-in delay-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          便签提醒
        </h2>
        <button
          onClick={() => setShowInput(!showInput)}
          className="glass-3 p-2 transition-transform duration-300"
          style={{ borderRadius: 'var(--radius-glass-xs)' }}
          aria-label="新增便签"
        >
          <Plus size={16} style={{ color: 'var(--color-accent)' }} />
        </button>
      </div>

      {showInput && (
        <div className="glass-2 p-3 animate-in">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="写点什么..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--color-glass-input)',
                borderRadius: 'var(--radius-glass-xs)',
                color: 'var(--color-text)',
              }}
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 text-sm font-medium text-white"
              style={{
                background: 'var(--color-accent)',
                borderRadius: 'var(--radius-glass-xs)',
              }}
            >
              添加
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="glass-3 px-4 py-3 flex items-start justify-between gap-3">
            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>
              {note.content}
            </p>
            <button
              onClick={() => handleDelete(note.id)}
              className="shrink-0 p-1 rounded-full transition-colors duration-300"
              style={{ color: 'var(--color-text-3)' }}
              aria-label="删除便签"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {notes.length === 0 && !showInput && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-3)' }}>
            还没有便签，点击 + 添加
          </p>
        )}
      </div>
    </section>
  )
}
