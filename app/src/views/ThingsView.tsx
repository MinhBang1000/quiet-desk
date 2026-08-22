import { useMemo, useState } from 'react'
import { ThingDetail } from '../components/ThingDetail'
import { ThingForm } from '../components/ThingForm'
import { ThingRow } from '../components/ThingRow'
import { BP_MOBILE, useMediaQuery } from '../hooks/useMediaQuery'
import { addDays, iso } from '../lib/date'
import { resolveThingLocation } from '../lib/things'
import { useStore } from '../store/useStore'
import type { Thing } from '../types'

type FilterId = 'all' | 'lent' | 'borrowed' | 'lost' | 'wishlist' | 'warranty' | number

export function ThingsView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const things = useStore((s) => s.things)
  const locations = useStore((s) => s.locations)
  const allCategories = useStore((s) => s.categories)
  const categories = allCategories.filter((c) => c.module === 'thing')
  const selectedThingId = useStore((s) => s.selectedThingId)
  const selectThing = useStore((s) => s.selectThing)

  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const selected = things.find((t) => t.id === selectedThingId) ?? null
  const warrantyHorizon = iso(addDays(new Date(), 30))

  const filtered = useMemo(() => {
    let list = things
    if (filter === 'lent') list = list.filter((t) => t.status === 'lent')
    else if (filter === 'borrowed') list = list.filter((t) => t.status === 'borrowed')
    else if (filter === 'lost') list = list.filter((t) => t.status === 'lost')
    else if (filter === 'wishlist') list = list.filter((t) => t.status === 'wishlist')
    else if (filter === 'warranty') list = list.filter((t) => t.warrantyExpires && t.warrantyExpires <= warrantyHorizon && t.warrantyExpires >= iso(new Date()))
    else if (typeof filter === 'number') list = list.filter((t) => t.categoryId === filter)

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((t) =>
        [t.name, t.brand, t.model, t.serialNumber, t.notes].some((v) => v.toLowerCase().includes(q))
      )
    }
    return list
  }, [things, filter, query, warrantyHorizon])

  // "By location" browsing: when no filter/search is active, group by
  // resolved location so the list doubles as a location browser.
  const grouped = useMemo(() => {
    if (filter !== 'all' || query.trim()) return null
    const groups = new Map<string, Thing[]>()
    for (const t of filtered) {
      const key = resolveThingLocation(t, things, locations)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filter, query, filtered, things, locations])

  const chips: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'lent', label: 'Lent' },
    { id: 'borrowed', label: 'Borrowed' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'lost', label: 'Lost' },
    { id: 'warranty', label: 'Warranty expiring' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ]

  const list = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Life</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: 30, fontWeight: 400, color: 'var(--fgs)' }}>Things</h1>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search things… try “HDMI adapter”"
        style={{ border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'var(--bg)', padding: '9px 12px', fontSize: 13.5, color: 'var(--fg)' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            style={{
              padding: '5px 11px',
              border: '1px solid var(--line2)',
              borderRadius: 99,
              background: filter === c.id ? 'var(--hover)' : 'transparent',
              color: filter === c.id ? 'var(--fgs)' : 'var(--dim)',
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
          selectThing(null)
        }}
        className="btn-primary"
        style={{ padding: '9px 14px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
      >
        + Add thing
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {grouped
          ? grouped.map(([loc, items]) => (
              <div key={loc} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.1em', color: 'var(--faint2)', padding: '6px 10px 4px' }}>{loc}</div>
                {items.map((t) => (
                  <ThingRow key={t.id} thing={t} active={t.id === selectedThingId} onClick={() => { setCreating(false); selectThing(t.id) }} />
                ))}
              </div>
            ))
          : filtered.map((t) => (
              <ThingRow key={t.id} thing={t} active={t.id === selectedThingId} onClick={() => { setCreating(false); selectThing(t.id) }} />
            ))}
        {filtered.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '8px 4px' }}>Nothing here yet.</div>}
      </div>
    </div>
  )

  const detail = creating ? (
    <ThingForm
      thing={null}
      onDone={(t) => {
        setCreating(false)
        selectThing(t.id)
      }}
      onCancel={() => setCreating(false)}
    />
  ) : selected ? (
    <ThingDetail thing={selected} onClose={() => selectThing(null)} />
  ) : (
    <div style={{ fontSize: 13, color: 'var(--faint)' }}>Pick a thing on the left, or add a new one.</div>
  )

  if (isMobile) {
    return (
      <div style={{ flex: 1, minWidth: 0, padding: '24px 18px' }}>
        {selected || creating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button
              onClick={() => {
                setCreating(false)
                selectThing(null)
              }}
              style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: 'var(--dim)', fontSize: 13 }}
            >
              ← Back to Things
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
