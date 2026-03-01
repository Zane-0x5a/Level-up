import './home.css'
import HeroSection from '@/components/home/HeroSection'
import CountdownSection from '@/components/home/CountdownSection'
import ProgressOverview from '@/components/home/ProgressOverview'
import StickyNotes from '@/components/home/StickyNotes'

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}>
      <HeroSection />
      <CountdownSection />
      <section className="section anim d2">
        <div className="home-grid">
          <ProgressOverview />
          <StickyNotes />
        </div>
      </section>
    </main>
  )
}
