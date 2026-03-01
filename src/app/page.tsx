import './home.css'
import HeroSection from '@/components/home/HeroSection'
import CountdownSection from '@/components/home/CountdownSection'
import ProgressOverview from '@/components/home/ProgressOverview'
import StickyNotes from '@/components/home/StickyNotes'

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
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
      </div>
    </main>
  )
}
