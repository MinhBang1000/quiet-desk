/** Deterministic initials placeholder (à la GitHub/Slack) for when no avatar is set. */
export function initialsAvatar(name: string, accent: string, ink: string): string {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${accent}" />
    <text x="100" y="100" font-family="Georgia, serif" font-size="82" fill="${ink}" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not read image'))
      img.onload = () => resolve(img)
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Downscales an already-loaded image client-side before it's stored as a
 * base64 data URL (the portfolio has no separate file-upload endpoint —
 * images travel as strings inside the same PUT /api/portfolio payload).
 * Resizing here keeps a phone photo from ballooning the portfolio row and
 * the public JSON payload.
 */
export function resizeImageToDataUrl(img: HTMLImageElement, maxDim: number, quality = 0.85): string {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

export function fileToResizedDataUrl(file: File, maxDim: number, quality = 0.85): Promise<string> {
  return loadImageFile(file).then((img) => resizeImageToDataUrl(img, maxDim, quality))
}

/**
 * Renders exactly what the crop viewport shows into a fixed-size square
 * canvas — offset/scale/viewport describe the same pan+zoom state the
 * on-screen crop preview uses, so what the user positioned is what gets
 * saved, not a blind center-crop of the original aspect ratio.
 */
export function renderSquareCrop(
  img: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  scale: number,
  viewport: number,
  output: number,
  quality = 0.88
): string {
  const canvas = document.createElement('canvas')
  canvas.width = output
  canvas.height = output
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  const factor = output / viewport
  ctx.drawImage(img, offsetX * factor, offsetY * factor, img.width * scale * factor, img.height * scale * factor)
  return canvas.toDataURL('image/jpeg', quality)
}
