export function getSupabaseStorageObjectPath(
  publicUrl: string,
  bucket: string
): string | null {
  try {
    const pathname = new URL(publicUrl).pathname
    const marker = `/object/public/${bucket}/`
    const markerIndex = pathname.indexOf(marker)
    if (markerIndex === -1) return null

    const encodedPath = pathname.slice(markerIndex + marker.length)
    return encodedPath ? decodeURIComponent(encodedPath) : null
  } catch {
    return null
  }
}
