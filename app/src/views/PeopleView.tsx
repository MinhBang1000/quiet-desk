import { useMemo, useState } from 'react'
import { PersonDetail } from '../components/PersonDetail'
import { PersonForm } from '../components/PersonForm'
import { PersonRow } from '../components/PersonRow'
import { BP_MOBILE, useMediaQuery } from '../hooks/useMediaQuery'
import { useStore } from '../store/useStore'

type FilterId = 'all' | 'favorites' | 'birthdays' | 'recent' | number

function dayOfYear(dateStr: string): number {
  const [, m, d] = dateStr.split('-').map(Number)
  return m * 31 + d // coarse but fine for "upcoming" ordering
}

export function PeopleView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const people = useStore((s) => s.people)
  const allCategories = useStore((s) => s.categories)
  const categories = allCategories.filter((c) => c.module === 'person')
  const selectedPersonId = useStore((s) => s.selectedPersonId)
  const selectPerson = useStore((s) => s.selectPerson)

  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const selected = people.find((p) => p.id === selectedPersonId) ?? null

  const filtered = useMemo(() => {
    let list = people
    if (filter === 'favorites') list = list.filter((p) => p.favorite)
    else if (filter === 'birthdays') {
      const todayDoy = dayOfYear(new Date().toISOString().slice(0, 10))
      list = list
        .filter((p) => p.birthday)
        .slice()
        .sort((a, b) => {
          const da = (dayOfYear(a.birthday!) - todayDoy + 400) % 400
          const db = (dayOfYear(b.birthday!) - todayDoy + 400) % 400
          return da - db
        })
    } else if (filter === 'recent') {
      list = list
        .filter((p) => p.lastContactedDate)
        .slice()
        .sort((a, b) => (b.lastContactedDate! < a.lastContactedDate! ? -1 : 1))
    } else if (typeof filter === 'number') {
      list = list.filter((p) => p.categoryIds.includes(filter))
    }
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        [p.fullName, p.nickname, p.organization, p.notes].some((v) => v.toLowerCase().includes(q))
      )
    }
    return list
  }, [people, filter, query])

  const chips: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'birthdays', label: 'Birthdays' },
    { id: 'recent', label: 'Recently contacted' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ]

  const list = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Life</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: 30, fontWeight: 400, color: 'var(--fgs)' }}>People</h1>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people…"
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
          selectPerson(null)
        }}
        className="btn-primary"
        style={{ padding: '9px 14px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
      >
        + Add person
      </button>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            active={p.id === selectedPersonId}
            onClick={() => {
              setCreating(false)
              selectPerson(p.id)
            }}
          />
        ))}
        {filtered.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '8px 4px' }}>No one here yet.</div>}
      </div>
    </div>
  )

  const detail = creating ? (
    <PersonForm
      person={null}
      onDone={(p) => {
        setCreating(false)
        selectPerson(p.id)
      }}
      onCancel={() => setCreating(false)}
    />
  ) : selected ? (
    <PersonDetail person={selected} onClose={() => selectPerson(null)} />
  ) : (
    <div style={{ fontSize: 13, color: 'var(--faint)' }}>Pick someone on the left, or add a new person.</div>
  )

  if (isMobile) {
    return (
      <div style={{ flex: 1, minWidth: 0, padding: '24px 18px' }}>
        {selected || creating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button
              onClick={() => {
                setCreating(false)
                selectPerson(null)
              }}
              style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: 'var(--dim)', fontSize: 13 }}
            >
              ← Back to People
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
