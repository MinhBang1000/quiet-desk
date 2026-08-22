import { useState } from 'react'
import { ListItemRow } from './ListItemRow'
import { inputStyle } from '../lib/formKit'
import { useStore } from '../store/useStore'
import type { ListEntity, ListItemLinkType } from '../types'

const STYLE_LABEL: Record<ListEntity['style'], string> = {
  simple: 'Simple list', checklist: 'Checklist', reusable_checklist: 'Reusable checklist', ranked: 'Ranked list',
}

interface ListDetailProps {
  list: ListEntity
  onClose: () => void
}

export function ListDetail({ list, onClose }: ListDetailProps) {
  const listItems = useStore((s) => s.listItems)
  const people = useStore((s) => s.people)
  const places = useStore((s) => s.places)
  const things = useStore((s) => s.things)
  const updateList = useStore((s) => s.updateList)
  const removeList = useStore((s) => s.removeList)
  const resetList = useStore((s) => s.resetList)
  const addListItem = useStore((s) => s.addListItem)
  const updateListItem = useStore((s) => s.updateListItem)

  const [draft, setDraft] = useState('')
  const [linkType, setLinkType] = useState<ListItemLinkType | ''>('')
  const [linkId, setLinkId] = useState('')

  const items = listItems.filter((i) => i.listId === list.id).sort((a, b) => a.position - b.position)
  const anyCompleted = items.some((i) => i.completed)

  const linkOptions = linkType === 'person' ? people : linkType === 'place' ? places : linkType === 'thing' ? things : []

  const addItem = async () => {
    const text = draft.trim()
    if (!text) return
    await addListItem(list.id, { text, linkType: linkType || null, linkId: linkId || null })
    setDraft('')
    setLinkType('')
    setLinkId('')
  }

  const moveItem = (id: string, dir: -1 | 1) => {
    const sorted = [...items]
    const idx = sorted.findIndex((i) => i.id === id)
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= sorted.length) return
    const a = sorted[idx];
    const b = sorted[targetIdx]
    updateListItem(a.id, { position: b.position })
    updateListItem(b.id, { position: a.position })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 24, color: 'var(--fgs)' }}>{list.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{STYLE_LABEL[list.style]} · {items.length} item{items.length === 1 ? '' : 's'}</div>
        </div>
        <button
          onClick={() => updateList(list.id, { favorite: !list.favorite })}
          title="Favorite"
          style={{ padding: '6px 8px', border: 0, background: 'transparent', color: list.favorite ? 'var(--accent)' : 'var(--faint2)', fontSize: 16 }}
        >
          ★
        </button>
        {list.style === 'reusable_checklist' && anyCompleted && (
          <button
            onClick={() => resetList(list.id)}
            className="btn-outline"
            style={{ padding: '7px 12px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}
          >
            Reset
          </button>
        )}
        <button
          onClick={() => {
            if (window.confirm(`Delete "${list.name}"? This can't be undone.`)) {
              removeList(list.id)
              onClose()
            }
          }}
          className="btn-text"
          style={{ padding: '7px 10px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12.5 }}
        >
          Delete
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <ListItemRow key={item.id} item={item} style={list.style} onMove={list.style === 'ranked' ? (dir) => moveItem(item.id, dir) : undefined} />
        ))}
        {items.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '8px 4px' }}>No items yet.</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 'calc(var(--r) + 1px)', background: 'var(--panel)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
            placeholder="Add an item…"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={addItem}
            className="btn-primary"
            style={{ padding: '9px 16px', border: 0, borderRadius: 'calc(var(--r) - 2px)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
          >
            Add
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={linkType}
            onChange={(e) => { setLinkType(e.target.value as ListItemLinkType | ''); setLinkId('') }}
            style={{ border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '5px 8px', fontSize: 12, color: 'var(--dim)' }}
          >
            <option value="">No link</option>
            <option value="person">Link to a Person</option>
            <option value="place">Link to a Place</option>
            <option value="thing">Link to a Thing</option>
          </select>
          {linkType && (
            <select
              value={linkId}
              onChange={(e) => setLinkId(e.target.value)}
              style={{ flex: 1, border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '5px 8px', fontSize: 12, color: 'var(--dim)' }}
            >
              <option value="">Choose…</option>
              {linkOptions.map((o) => (
                <option key={o.id} value={o.id}>{'fullName' in o ? o.fullName : o.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  )
}
