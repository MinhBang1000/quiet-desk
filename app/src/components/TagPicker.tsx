import { useEffect, useRef, useState } from 'react'
import { tagColor, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'

interface TagPickerProps {
  value: string
  onChange: (name: string) => void
}

export function TagPicker({ value, onChange }: TagPickerProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const tags = useStore((s) => s.tags)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const color = tagColor(theme, value, tags)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 10px',
          border: '1px solid var(--line2)',
          borderRadius: 'calc(var(--r) - 2px)',
          background: 'var(--bg)',
          color: 'var(--fg)',
          fontSize: 12.5,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 7, background: color, flex: 'none' }} />
        <span>{value}</span>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--faint)' }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 30,
            minWidth: 160,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 5,
            border: '1px solid var(--line2)',
            borderRadius: 'calc(var(--r) + 1px)',
            background: 'var(--panel)',
            boxShadow: '0 12px 28px rgba(0,0,0,.35)',
          }}
        >
          {tags.map((t) => {
            const on = t.name === value
            const c = tagColor(theme, t.name, tags)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.name)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 9px',
                  border: 0,
                  borderRadius: 'calc(var(--r) - 3px)',
                  background: on ? 'var(--hover)' : 'transparent',
                  color: on ? 'var(--fgs)' : 'var(--dim)',
                  fontSize: 12.5,
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 7, background: c, flex: 'none' }} />
                <span style={{ flex: 1, minWidth: 0 }}>{t.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
