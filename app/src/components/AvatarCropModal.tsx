import { useEffect, useRef, useState } from 'react'
import { loadImageFile, renderSquareCrop } from '../lib/image'

const VIEWPORT = 280
const OUTPUT = 480
const MAX_ZOOM = 3

interface Offset {
  x: number
  y: number
}

function clamp(offset: Offset, dispW: number, dispH: number): Offset {
  const minX = Math.min(0, VIEWPORT - dispW)
  const minY = Math.min(0, VIEWPORT - dispH)
  return { x: Math.min(0, Math.max(minX, offset.x)), y: Math.min(0, Math.max(minY, offset.y)) }
}

interface AvatarCropModalProps {
  file: File
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
}

export function AvatarCropModal({ file, onConfirm, onCancel }: AvatarCropModalProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null)

  useEffect(() => {
    let cancelled = false
    loadImageFile(file).then((loaded) => {
      if (cancelled) return
      const base = VIEWPORT / Math.min(loaded.width, loaded.height)
      setImg(loaded)
      setBaseScale(base)
      setZoom(1)
      setOffset({ x: (VIEWPORT - loaded.width * base) / 2, y: (VIEWPORT - loaded.height * base) / 2 })
    })
    return () => {
      cancelled = true
    }
  }, [file])

  if (!img) return null

  const scale = baseScale * zoom
  const dispW = img.width * scale
  const dispH = img.height * scale

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset(clamp({ x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy }, dispW, dispH))
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const handleZoom = (nextZoom: number) => {
    const nextScale = baseScale * nextZoom
    const cx = (VIEWPORT / 2 - offset.x) / scale
    const cy = (VIEWPORT / 2 - offset.y) / scale
    const nextDispW = img.width * nextScale
    const nextDispH = img.height * nextScale
    setOffset(clamp({ x: VIEWPORT / 2 - cx * nextScale, y: VIEWPORT / 2 - cy * nextScale }, nextDispW, nextDispH))
    setZoom(nextZoom)
  }

  const confirm = () => {
    onConfirm(renderSquareCrop(img, offset.x, offset.y, scale, VIEWPORT, OUTPUT))
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          padding: 24,
          borderRadius: 'calc(var(--r) + 2px)',
          border: '1px solid var(--line2)',
          background: 'var(--panel)',
          boxShadow: '0 24px 60px rgba(0,0,0,.4)',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--dim)' }}>Drag to reposition, scroll or use the slider to zoom.</div>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => {
            e.preventDefault()
            handleZoom(Math.min(MAX_ZOOM, Math.max(1, zoom - e.deltaY * 0.0015)))
          }}
          style={{
            width: VIEWPORT,
            height: VIEWPORT,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            touchAction: 'none',
            cursor: 'grab',
            border: '1px solid var(--line2)',
            background: 'var(--bg)',
          }}
        >
          <img
            src={img.src}
            draggable={false}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: dispW,
              height: dispH,
              maxWidth: 'none',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => handleZoom(Number(e.target.value))}
          style={{ width: VIEWPORT }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            className="btn-text"
            style={{ padding: '9px 16px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="btn-primary"
            style={{ padding: '9px 20px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}
          >
            Use photo
          </button>
        </div>
      </div>
    </div>
  )
}
