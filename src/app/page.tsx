import CountdownSection from '@/components/home/CountdownSection'
import StickyNotes from '@/components/home/StickyNotes'
import ProgressOverview from '@/components/home/ProgressOverview'

export default function HomePage() {
  return (
    <main className="p-4 pt-6 space-y-5 max-w-md mx-auto">
      <ProgressOverview />
      <CountdownSection />
      <StickyNotes />
    </main>
  )
}
