'use client'

interface Props {
  src: string
  onClose: () => void
}

export default function ImagePreview({ src, onClose }: Props) {
  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <img src={src} alt="" className="image-preview-img" />
    </div>
  )
}
