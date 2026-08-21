import { useState } from 'react'
import { THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'

function ColorDots({ colorIndex, onPick }: { colorIndex: number; onPick: (i: number) => void }) {
  const theme = useStore((s) => THEMES[s.theme])
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {theme.tags.map((c, i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          style={{
            width: 14,
            height: 14,
            borderRadius: 14,
            border: `1px solid ${i === colorIndex ? 'var(--fgs)' : 'transparent'}`,
            background: c,
            padding: 0,
          }}
        />
      ))}
    </div>
  )
}

function TagRow({ tag }: { tag: { id: number; name: string; colorIndex: number } }) {
  const theme = useStore((s) => THEMES[s.theme])
  const renameTag = useStore((s) => s.renameTag)
  const recolorTag = useStore((s) => s.recolorTag)
  const deleteTag = useStore((s) => s.deleteTag)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tag.name)

  const color = theme.tags[tag.colorIndex % theme.tags.length]

  const commit = () => {
    const name = draft.trim()
    if (name && name !== tag.name) renameTag(tag.id, name)
    else setDraft(tag.name)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 8, background: color, flex: 'none' }} />
        {editing ? (
          <input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setDraft(tag.name)
                setEditing(false)
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              border: '1px solid var(--line2)',
              borderRadius: 'calc(var(--r) - 3px)',
              background: 'var(--bg)',
              padding: '3px 6px',
              fontSize: 12.5,
              color: 'var(--fg)',
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{ flex: 1, minWidth: 0, textAlign: 'left', padding: 0, border: 0, background: 'transparent', fontSize: 12.5, color: 'var(--fg)' }}
          >
            {tag.name}
          </button>
        )}
        <button
          onClick={() => deleteTag(tag.id)}
          style={{ flex: 'none', padding: '2px 5px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}
        >
          ×
        </button>
      </div>
      <div style={{ paddingLeft: 16 }}>
        <ColorDots colorIndex={tag.colorIndex} onPick={(i) => recolorTag(tag.id, i)} />
      </div>
    </div>
  )
}

export function TagManager() {
  const tags = useStore((s) => s.tags)
  const addTag = useStore((s) => s.addTag)
  const [draft, setDraft] = useState('')

  const submit = () => {
    const name = draft.trim()
    if (!name) return
    addTag(name)
    setDraft('')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 14,
        border: '1px solid var(--line)',
        borderRadius: 'calc(var(--r) + 1px)',
        background: 'var(--panel)',
      }}
    >
      <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        Tags
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tags.map((t) => (
          <TagRow key={t.id} tag={t} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="+ Add tag"
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
  )
}
