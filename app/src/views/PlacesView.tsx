import { useMemo, useState } from 'react'
import { PlaceDetail } from '../components/PlaceDetail'
import { PlaceForm } from '../components/PlaceForm'
import { PlaceRow } from '../components/PlaceRow'
import { BP_MOBILE, useMediaQuery } from '../hooks/useMediaQuery'
import { useStore } from '../store/useStore'

type FilterId = 'all' | 'favorites' | 'want' | 'visited' | { category: number } | { collection: string }

export function PlacesView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const places = useStore((s) => s.places)
  const allCategories = useStore((s) => s.categories)
  const categories = allCategories.filter((c) => c.module === 'place')
  const collections = useStore((s) => s.collections)
  const selectedPlaceId = useStore((s) => s.selectedPlaceId)
  const selectPlace = useStore((s) => s.selectPlace)

  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const selected = places.find((p) => p.id === selectedPlaceId) ?? null

  const filtered = useMemo(() => {
    let list = places
    if (filter === 'favorites') list = list.filter((p) => p.favorite)
    else if (filter === 'want') list = list.filter((p) => p.wantToVisit)
    else if (filter === 'visited') list = list.filter((p) => p.visited)
    else if (typeof filter === 'object' && 'category' in filter) list = list.filter((p) => p.categoryId === filter.category)
    else if (typeof filter === 'object' && 'collection' in filter) {
      const coll = collections.find((c) => c.id === filter.collection)
      list = coll ? list.filter((p) => coll.placeIds.includes(p.id)) : []
    }
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((p) => [p.name, p.address, p.notes, p.city].some((v) => v.toLowerCase().includes(q)))
    return list
  }, [places, filter, query, collections])

  const isFilterActive = (id: FilterId) => JSON.stringify(id) === JSON.stringify(filter)

  const list = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Life</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: 30, fontWeight: 400, color: 'var(--fgs)' }}>Places</h1>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search places…"
        style={{ border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'var(--bg)', padding: '9px 12px', fontSize: 13.5, color: 'var(--fg)' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {([
          { id: 'all' as const, label: 'All' },
          { id: 'favorites' as const, label: 'Favorites' },
          { id: 'want' as const, label: 'Want to Visit' },
          { id: 'visited' as const, label: 'Visited' },
          ...categories.map((c) => ({ id: { category: c.id }, label: c.name })),
          ...collections.map((c) => ({ id: { collection: c.id }, label: c.name })),
        ]).map((c, i) => (
          <button
            key={i}
            onClick={() => setFilter(c.id)}
            style={{
              padding: '5px 11px',
              border: '1px solid var(--line2)',
              borderRadius: 99,
              background: isFilterActive(c.id) ? 'var(--hover)' : 'transparent',
              color: isFilterActive(c.id) ? 'var(--fgs)' : 'var(--dim)',
              fontSize: 11.5,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          setCreating(true)
          selectPlace(null)
        }}
        className="btn-primary"
        style={{ padding: '9px 14px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
      >
        + Add place
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.map((p) => (
          <PlaceRow key={p.id} place={p} active={p.id === selectedPlaceId} onClick={() => { setCreating(false); selectPlace(p.id) }} />
        ))}
        {filtered.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '8px 4px' }}>No places here yet.</div>}
      </div>
    </div>
  )

  const detail = creating ? (
    <PlaceForm place={null} onDone={(p) => { setCreating(false); selectPlace(p.id) }} onCancel={() => setCreating(false)} />
  ) : selected ? (
    <PlaceDetail place={selected} onClose={() => selectPlace(null)} />
  ) : (
    <div style={{ fontSize: 13, color: 'var(--faint)' }}>Pick a place on the left, or add a new one.</div>
  )

  if (isMobile) {
    return (
      <div style={{ flex: 1, minWidth: 0, padding: '24px 18px' }}>
        {selected || creating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button onClick={() => { setCreating(false); selectPlace(null) }} style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: 'var(--dim)', fontSize: 13 }}>
              ← Back to Places
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
