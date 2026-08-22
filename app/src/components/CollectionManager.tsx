import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Collection } from '../types'

function CollectionRow({ collection }: { collection: Collection }) {
  const renameCollection = useStore((s) => s.renameCollection)
  const removeCollection = useStore((s) => s.removeCollection)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(collection.name)

  const commit = () => {
    const name = draft.trim()
    if (name && name !== collection.name) renameCollection(collection.id, name)
    else setDraft(collection.name)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      {editing ? (
        <input
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(collection.name); setEditing(false) }
          }}
          style={{ flex: 1, minWidth: 0, border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '3px 6px', fontSize: 12.5, color: 'var(--fg)' }}
        />
      ) : (
        <button onClick={() => setEditing(true)} style={{ flex: 1, minWidth: 0, textAlign: 'left', padding: 0, border: 0, background: 'transparent', fontSize: 12.5, color: 'var(--fg)' }}>
          {collection.name} <span style={{ color: 'var(--faint)' }}>({collection.placeIds.length})</span>
        </button>
      )}
      <button onClick={() => removeCollection(collection.id)} style={{ flex: 'none', padding: '2px 5px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}>×</button>
    </div>
  )
}

export function CollectionManager() {
  const collections = useStore((s) => s.collections)
  const addCollection = useStore((s) => s.addCollection)
  const [draft, setDraft] = useState('')

  const submit = () => {
    const name = draft.trim()
    if (!name) return
    addCollection(name)
    setDraft('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, border: '1px solid var(--line)', borderRadius: 'calc(var(--r) + 1px)', background: 'var(--panel)' }}>
      <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Place collections</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {collections.map((c) => (
          <CollectionRow key={c.id} collection={c} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="+ Add collection"
          style={{ flex: 1, minWidth: 0, border: '1px dashed var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', padding: '6px 8px', fontSize: 12.5, color: 'var(--fg)' }}
        />
      </div>
    </div>
  )
}
