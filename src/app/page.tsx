import './home.css'
import HeroSection from '@/components/home/HeroSection'
import CountdownSection from '@/components/home/CountdownSection'
import ProgressOverview from '@/components/home/ProgressOverview'
import StickyNotes from '@/components/home/StickyNotes'
import CommunityCard from '@/components/home/CommunityCard'

export default function HomePage() {
  return (
    <main className="home-main">
      <div className="home-layout">
        {/* Row 1: Hero (left) + Countdown Carousel (right) — 1fr 1fr */}
        <div className="home-row1 anim">
          <div className="grid-hero">
            <HeroSection />
          </div>
          <div className="grid-countdown">
            <CountdownSection />
          </div>
        </div>

        {/* Row 2: Overview (left) + Notes (right) — 3fr 2fr */}
        <div className="home-row2 anim d2">
          <ProgressOverview />
          <StickyNotes />
        </div>

        {/* Row 3: Community entry card */}
        <div className="home-row3 anim d3">
          <CommunityCard />
        </div>
      </div>
    </main>
  )
}
