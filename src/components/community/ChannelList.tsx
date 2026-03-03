'use client'

import { useState } from 'react'
import { createChannel, deleteChannel, type Channel } from '@/lib/api/channels'

interface Props {
  channels: Channel[]
  activeChannelId: string | null
  onSelect: (id: string) => void
  isAdmin: boolean
  userId: string
  onChannelsChange: () => void
}

export default function ChannelList({ channels, activeChannelId, onSelect, isAdmin, userId, onChannelsChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await createChannel(newName.trim(), userId)
      setNewName('')
      setAdding(false)
      onChannelsChange()
    } catch (err) {
      console.error('创建频道失败:', err)
    }
  }

  const handleDelete = async (channelId: string) => {
    if (!window.confirm('删除频道将同时删除所有消息，确定要继续吗？')) return
    try {
      await deleteChannel(channelId)
      onChannelsChange()
    } catch (err) {
      console.error('删除频道失败:', err)
    }
  }

  return (
    <aside className="channel-sidebar">
      <div className="channel-header">
        <span className="channel-header-title">频道</span>
        {isAdmin && (
          <button
            className="channel-header-add-btn"
            onClick={() => setAdding(!adding)}
            title="新建频道"
          >
            +
          </button>
        )}
      </div>
      {adding && (
        <div className="channel-add-form">
          <input
            className="field-input channel-add-input"
            placeholder="频道名称"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            autoFocus
          />
          <div className="channel-add-btns">
            <button className="btn-warm channel-add-confirm" onClick={handleAdd} disabled={!newName.trim()}>创建</button>
            <button className="btn-outline channel-add-cancel" onClick={() => { setAdding(false); setNewName('') }}>取消</button>
          </div>
        </div>
      )}
      <div className="channel-list">
        {channels.map(ch => (
          <div
            key={ch.id}
            className={`channel-item${ch.id === activeChannelId ? ' active' : ''}`}
            onClick={() => onSelect(ch.id)}
          >
            <span className="channel-item-hash">#</span>
            <span className="channel-item-name">{ch.name}</span>
            {isAdmin && (
              <button
                className="channel-delete-btn"
                onClick={e => { e.stopPropagation(); handleDelete(ch.id) }}
                title="删除频道"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
