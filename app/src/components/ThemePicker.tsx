import { useEffect, useRef, useState } from 'react'
import { THEME_ORDER, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'

export function ThemePicker() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = THEMES[theme]

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
        onClick={() => setOpen((v) => !v)}
        className="theme-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 9,
          padding: '8px 10px',
          border: '1px solid var(--line2)',
          borderRadius: 'var(--r)',
          background: 'var(--panel)',
          color: 'var(--fgs)',
          fontSize: 12.5,
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            flex: 'none',
            width: 13,
            height: 13,
            borderRadius: 3,
            background: current.bg,
            border: `1px solid ${current.line2}`,
            boxShadow: `inset -5px 0 0 ${current.accent}`,
          }}
        />
        <span style={{ flex: 1, minWidth: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current.label}
        </span>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--faint)' }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 30,
            maxHeight: 320,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 6,
            border: '1px solid var(--line2)',
            borderRadius: 'calc(var(--r) + 2px)',
            background: 'var(--panel)',
            boxShadow: '0 12px 28px rgba(0,0,0,.35)',
          }}
        >
          {THEME_ORDER.map((id) => {
            const th = THEMES[id]
            const on = id === theme
            return (
              <button
                key={id}
                onClick={() => {
                  setTheme(id)
                  setOpen(false)
                }}
                className="theme-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 10px',
                  border: `1px solid ${on ? 'var(--line2)' : 'transparent'}`,
                  borderRadius: 'var(--r)',
                  background: on ? 'var(--hover)' : 'transparent',
                  color: on ? 'var(--fgs)' : 'var(--dim)',
                  fontSize: 12.5,
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    flex: 'none',
                    width: 13,
                    height: 13,
                    borderRadius: 3,
                    background: th.bg,
                    border: `1px solid ${th.line2}`,
                    boxShadow: `inset -5px 0 0 ${th.accent}`,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>{th.label}</span>
                <span style={{ fontFamily: 'var(--fm)', fontSize: 14, color: on ? 'var(--accent)' : 'transparent', lineHeight: 1 }}>
                  ·
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
