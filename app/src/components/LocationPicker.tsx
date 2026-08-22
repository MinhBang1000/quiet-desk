import { useEffect, useRef, useState } from 'react'
import { locationAncestors, locationChildren, locationPath } from '../lib/locations'
import { useStore } from '../store/useStore'

interface LocationPickerProps {
  value: string | null
  onChange: (id: string | null) => void
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const locations = useStore((s) => s.locations)
  const addLocation = useStore((s) => s.addLocation)
  const [open, setOpen] = useState(false)
  const [browsingId, setBrowsingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const toggleOpen = () => {
    if (!open) {
      // Start browsing at the level the current value lives in.
      const ancestors = locationAncestors(value, locations)
      setBrowsingId(ancestors.length ? (ancestors[ancestors.length - 1].parentId ?? null) : null)
    }
    setOpen((v) => !v)
  }

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

  const crumbs = locationAncestors(browsingId, locations)
  const children = locationChildren(browsingId, locations)

  const createHere = async () => {
    const name = draft.trim()
    if (!name) return
    const created = await addLocation(name, browsingId)
    setDraft('')
    onChange(created.id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={toggleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          width: '100%',
          padding: '9px 11px',
          border: '1px solid var(--line2)',
          borderRadius: 'calc(var(--r) - 2px)',
          background: 'var(--bg)',
          color: value ? 'var(--fg)' : 'var(--faint)',
          fontSize: 13,
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? locationPath(value, locations) : 'No location set'}
        </span>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 9, color: 'var(--faint)' }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 30,
            minWidth: 260,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 10,
            border: '1px solid var(--line2)',
            borderRadius: 'calc(var(--r) + 1px)',
            background: 'var(--panel)',
            boxShadow: '0 12px 28px rgba(0,0,0,.35)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 11.5 }}>
            <button
              onClick={() => setBrowsingId(null)}
              style={{ padding: 0, border: 0, background: 'transparent', color: browsingId === null ? 'var(--fgs)' : 'var(--dim)' }}
            >
              Root
            </button>
            {crumbs.map((c) => (
              <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--faint2)' }}>›</span>
                <button
                  onClick={() => setBrowsingId(c.id)}
                  style={{ padding: 0, border: 0, background: 'transparent', color: c.id === browsingId ? 'var(--fgs)' : 'var(--dim)' }}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(browsingId)
              setOpen(false)
            }}
            style={{
              padding: '7px 9px',
              border: `1px dashed ${browsingId === value ? 'var(--accent)' : 'var(--line2)'}`,
              borderRadius: 'calc(var(--r) - 3px)',
              background: 'transparent',
              color: 'var(--dim)',
              fontSize: 12,
              textAlign: 'left',
            }}
          >
            {browsingId ? 'Use this level' : 'No location'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 180, overflowY: 'auto' }}>
            {children.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => {
                    onChange(c.id)
                    setOpen(false)
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    padding: '7px 9px',
                    border: 0,
                    borderRadius: 'calc(var(--r) - 3px)',
                    background: c.id === value ? 'var(--hover)' : 'transparent',
                    color: c.id === value ? 'var(--fgs)' : 'var(--dim)',
                    fontSize: 12.5,
                  }}
                >
                  {c.name}
                </button>
                <button
                  onClick={() => setBrowsingId(c.id)}
                  title="Open"
                  style={{ flex: 'none', padding: '4px 8px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12 }}
                >
                  ▸
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createHere()
              }}
              placeholder="+ Add location here"
              style={{
                flex: 1,
                minWidth: 0,
                border: '1px dashed var(--line2)',
                borderRadius: 'calc(var(--r) - 2px)',
                background: 'transparent',
                padding: '6px 8px',
                fontSize: 12.5,
                color: 'var(--fg)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
