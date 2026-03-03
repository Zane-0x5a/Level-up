'use client'
import type { Channel } from '@/lib/api/channels'

interface Props {
  channels: Channel[]
  activeChannelId: string | null
  onSelect: (id: string) => void
  isAdmin: boolean
  userId: string
  onChannelsChange: () => void
}

export default function ChannelList({ channels, activeChannelId, onSelect, isAdmin, userId, onChannelsChange }: Props) {
  return (
    <aside className="channel-sidebar">
      <div className="channel-header">
        <span className="channel-header-title">频道</span>
      </div>
      <div className="channel-list">
        {channels.map(ch => (
          <button
            key={ch.id}
            className={`channel-item${activeChannelId === ch.id ? ' active' : ''}`}
            onClick={() => onSelect(ch.id)}
          >
            <span className="channel-item-hash">#</span>
            <span className="channel-item-name">{ch.name}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
