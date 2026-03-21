'use client'

import Link from 'next/link'

export default function CommunityCard() {
  return (
    <Link href="/community" className="community-entry-card float-card glow-sage">
      <div className="community-entry-icon">💬</div>
      <div className="community-entry-text">
        <span className="community-entry-title">社群</span>
        <span className="community-entry-desc">和小伙伴聊天、打卡分享</span>
      </div>
      <span className="community-entry-arrow">→</span>
    </Link>
  )
}
