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

        {/* Row 2: two columns. Left stacks overview + community; right is the
            notes sidebar. Independent columns — neither inflates the other. */}
        <div className="home-row2 anim d2">
          <div className="ga-left">
            <div className="ga-overview">
              <ProgressOverview />
            </div>
            <div className="ga-community">
              <CommunityCard />
            </div>
          </div>
          <div className="ga-notes">
            <StickyNotes />
          </div>
        </div>
      </div>
    </main>
  )
}
