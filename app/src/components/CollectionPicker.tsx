import { useState } from 'react'
import { useStore } from '../store/useStore'

interface CollectionPickerProps {
  placeId: string
}

// Collections own the membership list (Collection.placeIds), not the other
// way around — so toggling here mutates the affected collection directly,
// which only makes sense once the place has a real id (i.e. after its
// first save, not while still drafting a brand-new one).
export function CollectionPicker({ placeId }: CollectionPickerProps) {
  const collections = useStore((s) => s.collections)
  const setCollectionMembers = useStore((s) => s.setCollectionMembers)
  const addCollection = useStore((s) => s.addCollection)
  const [draft, setDraft] = useState('')

  const toggle = (collectionId: string, placeIds: string[]) => {
    const next = placeIds.includes(placeId) ? placeIds.filter((id) => id !== placeId) : [...placeIds, placeId]
    setCollectionMembers(collectionId, next)
  }

  const createAndAdd = async () => {
    const name = draft.trim()
    if (!name) return
    const created = await addCollection(name)
    setDraft('')
    setCollectionMembers(created.id, [placeId])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {collections.map((c) => {
          const on = c.placeIds.includes(placeId)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id, c.placeIds)}
              style={{
                padding: '5px 10px',
                border: `1px solid ${on ? 'var(--accent)' : 'var(--line2)'}`,
                borderRadius: 99,
                background: on ? 'var(--hover)' : 'transparent',
                color: on ? 'var(--fgs)' : 'var(--dim)',
                fontSize: 12,
              }}
            >
              {c.name}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') createAndAdd()
          }}
          placeholder="+ New collection (e.g. Hsinchu Favorites)"
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
