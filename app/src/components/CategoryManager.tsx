import { useState } from 'react'
import { THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'
import type { Category, CategoryModule } from '../types'

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

function CategoryRow({ category }: { category: Category }) {
  const theme = useStore((s) => THEMES[s.theme])
  const renameCategory = useStore((s) => s.renameCategory)
  const recolorCategory = useStore((s) => s.recolorCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(category.name)

  const color = theme.tags[category.colorIndex % theme.tags.length]

  const commit = () => {
    const name = draft.trim()
    if (name && name !== category.name) renameCategory(category.id, name)
    else setDraft(category.name)
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
                setDraft(category.name)
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
            {category.name}
          </button>
        )}
        <button
          onClick={() => deleteCategory(category.id)}
          style={{ flex: 'none', padding: '2px 5px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}
        >
          ×
        </button>
      </div>
      <div style={{ paddingLeft: 16 }}>
        <ColorDots colorIndex={category.colorIndex} onPick={(i) => recolorCategory(category.id, i)} />
      </div>
    </div>
  )
}

interface CategoryManagerProps {
  module: CategoryModule
  label: string
}

export function CategoryManager({ module, label }: CategoryManagerProps) {
  // Filtering here rather than inside the selector keeps the selector's
  // return value referentially stable — a fresh array on every call breaks
  // useSyncExternalStore's snapshot comparison and loops forever.
  const allCategories = useStore((s) => s.categories)
  const categories = allCategories.filter((c) => c.module === module)
  const addCategory = useStore((s) => s.addCategory)
  const [draft, setDraft] = useState('')

  const submit = () => {
    const name = draft.trim()
    if (!name) return
    addCategory(module, name)
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
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder={`+ Add ${label.toLowerCase()}`}
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
