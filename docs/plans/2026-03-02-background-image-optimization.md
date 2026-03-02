# Background Image Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add thumbnail display in Settings and device-type filtering for focus background images.

**Architecture:** Add `device_type` column to `focus_images` table; generate thumbnails client-side via Canvas; filter images in focus mode using `matchMedia('(max-width: 768px)')`.

**Tech Stack:** Next.js 14, Supabase, Canvas API, vanilla CSS

---

### Task 1: Database Migration (Manual)

**Files:**
- No code changes — run SQL in Supabase SQL Editor

**Step 1: Run migration in Supabase**

Go to Supabase → SQL Editor, run:

```sql
ALTER TABLE focus_images
  ADD COLUMN device_type text NOT NULL DEFAULT 'universal'
  CHECK (device_type IN ('mobile', 'desktop', 'universal'));
```

Expected: success, no rows affected (existing rows get default 'universal')

---

### Task 2: Update API and Types

**Files:**
- Modify: `src/lib/api/focus-images.ts`

**Step 1: Update type and uploadFocusImage signature**

Replace the file content:

```ts
import { supabase } from '@/lib/supabase'
import { DEFAULT_USER_ID } from '@/lib/constants'

export type FocusImage = {
  id: string
  file_path: string
  device_type: 'mobile' | 'desktop' | 'universal'
}

export async function getFocusImages(): Promise<FocusImage[]> {
  const { data, error } = await supabase
    .from('focus_images')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID)
  if (error) throw error
  return data ?? []
}

export async function uploadFocusImage(
  file: File,
  deviceType: 'mobile' | 'desktop' | 'universal' = 'universal'
) {
  const filePath = `focus/${DEFAULT_USER_ID}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('focus-images')
    .upload(filePath, file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('focus-images')
    .getPublicUrl(filePath)

  const { error } = await supabase
    .from('focus_images')
    .insert({ user_id: DEFAULT_USER_ID, file_path: urlData.publicUrl, device_type: deviceType })
  if (error) throw error
}

export async function deleteFocusImage(id: string) {
  const { error } = await supabase
    .from('focus_images')
    .delete()
    .eq('id', id)
  if (error) throw error
}
```

**Step 2: Commit**

```bash
git add src/lib/api/focus-images.ts
git commit -m "feat: add device_type to FocusImage type and upload API"
```

---

### Task 3: Update Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`

**Step 1: Add thumbnail generation utility**

Add this helper function before the component (after imports):

```ts
function generateThumbnail(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX = 200
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => resolve(url) // fallback to original
    img.src = url
  })
}
```

**Step 2: Add state for thumbnails and device type selector**

In the component, add these state variables after existing state:

```ts
const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
const [uploadDeviceType, setUploadDeviceType] = useState<'mobile' | 'desktop' | 'universal'>('universal')
```

**Step 3: Generate thumbnails when images load**

Add a useEffect after the existing `useEffect(() => { loadMedia() }, [loadMedia])`:

```ts
useEffect(() => {
  if (images.length === 0) return
  images.forEach(img => {
    if (thumbnails[img.id]) return
    generateThumbnail(img.file_path).then(dataUrl => {
      setThumbnails(prev => ({ ...prev, [img.id]: dataUrl }))
    })
  })
}, [images]) // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 4: Update handleImageUpload to pass deviceType**

Change:
```ts
await uploadFocusImage(file)
```
To:
```ts
await uploadFocusImage(file, uploadDeviceType)
```

**Step 5: Update the image grid UI**

Replace the image grid section (the `<div className="image-grid">` block):

```tsx
<div className="image-grid">
  {images.map(img => (
    <div key={img.id} className="image-thumb">
      <img src={thumbnails[img.id] ?? img.file_path} alt="" />
      <span className="image-thumb-tag">{img.device_type === 'universal' ? '通' : img.device_type === 'mobile' ? '机' : '脑'}</span>
      <button
        onClick={() => handleDeleteImage(img.id)}
        className="image-thumb-delete"
        aria-label="删除图片"
      >
        ×
      </button>
    </div>
  ))}
  <div className="image-upload-controls">
    <select
      value={uploadDeviceType}
      onChange={e => setUploadDeviceType(e.target.value as 'mobile' | 'desktop' | 'universal')}
      className="device-type-select"
    >
      <option value="universal">通用</option>
      <option value="mobile">手机</option>
      <option value="desktop">电脑</option>
    </select>
    <label className="image-upload-trigger">
      <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
      <span>上传图片</span>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
        disabled={uploadingImage}
      />
    </label>
  </div>
</div>
```

**Step 6: Add CSS for new elements**

In `src/app/settings/settings.css`, add:

```css
.image-thumb-tag {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: var(--font-mono);
}

.image-upload-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.device-type-select {
  width: 100%;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
}
```

**Step 7: Commit**

```bash
git add src/app/settings/page.tsx src/app/settings/settings.css
git commit -m "feat: thumbnail generation and device type selector in settings"
```

---

### Task 4: Update Focus Mode Filtering

**Files:**
- Modify: `src/components/focus/FocusImmersiveState.tsx`

**Step 1: Update the image selection logic**

In `FocusImmersiveState.tsx`, replace the image selection block inside `load()`:

```ts
if (images.length > 0) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const filtered = images.filter(img =>
    img.device_type === 'universal' ||
    (isMobile ? img.device_type === 'mobile' : img.device_type === 'desktop')
  )
  const pool = filtered.length > 0 ? filtered : images
  const random = pool[Math.floor(Math.random() * pool.length)]
  setBgUrl(random.file_path)
}
```

**Step 2: Update the import to use named type**

Change the import line:
```ts
import { getFocusImages } from '@/lib/api/focus-images'
```
to:
```ts
import { getFocusImages, type FocusImage } from '@/lib/api/focus-images'
```

And update the destructured type in `load()`:
```ts
const [images, notes, currentCount] = await Promise.all([...])
```
(No change needed — TypeScript infers from getFocusImages return type)

**Step 3: Commit**

```bash
git add src/components/focus/FocusImmersiveState.tsx
git commit -m "feat: filter focus background images by device type"
```

---

### Task 5: Push PR

```bash
git push
gh pr create --title "feat: background image thumbnails and device-type filtering" --body "- Settings page shows Canvas-generated thumbnails instead of full images
- Upload UI includes device type selector (通用/手机/电脑)
- Focus mode filters images by device type using matchMedia(768px)
- Existing images default to 'universal'"
```
