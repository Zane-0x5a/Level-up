'use client'

interface Props {
  src: string
  onClose: () => void
}

export default function ImagePreview({ src, onClose }: Props) {
  return (
    <div className="image-preview-overlay" onClick={onClose}>
      {/* Dynamic Supabase public URLs are intentionally rendered natively in this static export. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="image-preview-img" />
    </div>
  )
}
