import { useMemo, useState } from 'react'
import { ListDetail } from '../components/ListDetail'
import { BP_MOBILE, useMediaQuery } from '../hooks/useMediaQuery'
import { inputStyle } from '../lib/formKit'
import { useStore } from '../store/useStore'
import type { ListEntity } from '../types'

type FilterId = 'all' | 'recent' | 'favorites' | 'checklists' | 'reusable'

const STYLE_OPTIONS: { id: ListEntity['style']; label: string }[] = [
  { id: 'simple', label: 'Simple list' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'reusable_checklist', label: 'Reusable checklist' },
  { id: 'ranked', label: 'Ranked list' },
]

function CreateListForm({ onDone, onCancel }: { onDone: (list: ListEntity) => void; onCancel: () => void }) {
  const addList = useStore((s) => s.addList)
  const [name, setName] = useState('')
  const [style, setStyle] = useState<ListEntity['style']>('simple')

  const create = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const created = await addList(trimmed, style)
    onDone(created)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420 }}>
      <div style={{ fontFamily: 'var(--fd)', fontSize: 22, color: 'var(--fgs)' }}>New list</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Books to read" style={inputStyle} autoFocus />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STYLE_OPTIONS.map((o) => (
          <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg)' }}>
            <input type="radio" checked={style === o.id} onChange={() => setStyle(o.id)} />
            {o.label}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={create} className="btn-primary" style={{ padding: '10px 20px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>
          Create
        </button>
        <button onClick={onCancel} className="btn-text" style={{ padding: '10px 14px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function ListsView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const lists = useStore((s) => s.lists)
  const selectedListId = useStore((s) => s.selectedListId)
  const selectList = useStore((s) => s.selectList)

  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const selected = lists.find((l) => l.id === selectedListId) ?? null

  const filtered = useMemo(() => {
    let out = lists
    if (filter === 'recent') out = [...out].sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1)).slice(0, 10)
    else if (filter === 'favorites') out = out.filter((l) => l.favorite)
    else if (filter === 'checklists') out = out.filter((l) => l.style === 'checklist' || l.style === 'reusable_checklist')
    else if (filter === 'reusable') out = out.filter((l) => l.style === 'reusable_checklist')
    const q = query.trim().toLowerCase()
    if (q) out = out.filter((l) => l.name.toLowerCase().includes(q))
    return out
  }, [lists, filter, query])

  const chips: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'recent', label: 'Recent' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'checklists', label: 'Checklists' },
    { id: 'reusable', label: 'Reusable' },
  ]

  const list = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Life</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: 30, fontWeight: 400, color: 'var(--fgs)' }}>Lists</h1>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lists…" style={{ border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'var(--bg)', padding: '9px 12px', fontSize: 13.5, color: 'var(--fg)' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            style={{ padding: '5px 11px', border: '1px solid var(--line2)', borderRadius: 99, background: filter === c.id ? 'var(--hover)' : 'transparent', color: filter === c.id ? 'var(--fgs)' : 'var(--dim)', fontSize: 11.5 }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => { setCreating(true); selectList(null) }}
        className="btn-primary"
        style={{ padding: '9px 14px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
      >
        + Add list
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.map((l) => (
          <button
            key={l.id}
            onClick={() => { setCreating(false); selectList(l.id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', textAlign: 'left',
              border: `1px solid ${l.id === selectedListId ? 'var(--accent)' : 'transparent'}`, borderRadius: 'var(--r)',
              background: l.id === selectedListId ? 'var(--hover)' : 'transparent',
            }}
          >
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {l.name}
              {l.favorite && <span style={{ color: 'var(--accent)' }}> ★</span>}
            </span>
          </button>
        ))}
        {filtered.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '8px 4px' }}>No lists yet.</div>}
      </div>
    </div>
  )

  const detail = creating ? (
    <CreateListForm onDone={(l) => { setCreating(false); selectList(l.id) }} onCancel={() => setCreating(false)} />
  ) : selected ? (
    <ListDetail list={selected} onClose={() => selectList(null)} />
  ) : (
    <div style={{ fontSize: 13, color: 'var(--faint)' }}>Pick a list on the left, or start a new one.</div>
  )

  if (isMobile) {
    return (
      <div style={{ flex: 1, minWidth: 0, padding: '24px 18px' }}>
        {selected || creating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button onClick={() => { setCreating(false); selectList(null) }} style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: 'var(--dim)', fontSize: 13 }}>
              ← Back to Lists
            </button>
            {detail}
          </div>
        ) : (
          list
        )}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
      <div style={{ width: 300, flex: 'none', borderRight: '1px solid var(--line)', padding: '32px 20px' }}>{list}</div>
      <div style={{ flex: 1, minWidth: 0, padding: '32px 40px', overflowY: 'auto' }}>{detail}</div>
    </div>
  )
}
