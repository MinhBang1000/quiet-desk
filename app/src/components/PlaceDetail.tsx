import { useState } from 'react'
import { CollectionPicker } from './CollectionPicker'
import { PlaceForm } from './PlaceForm'
import { categoryColor, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'
import type { Place } from '../types'

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
      <span style={{ flex: '0 0 120px', color: 'var(--faint)' }}>{label}</span>
      <span style={{ color: 'var(--fg)' }}>{value}</span>
    </div>
  )
}

interface PlaceDetailProps {
  place: Place
  onClose: () => void
}

export function PlaceDetail({ place, onClose }: PlaceDetailProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const categories = useStore((s) => s.categories)
  const people = useStore((s) => s.people)
  const links = useStore((s) => s.links)
  const removePlace = useStore((s) => s.removePlace)
  const addLink = useStore((s) => s.addLink)
  const removeLink = useStore((s) => s.removeLink)
  const [editing, setEditing] = useState(false)
  const [addingRecommender, setAddingRecommender] = useState('')

  const category = categories.find((c) => c.id === place.categoryId)
  const tags = categories.filter((c) => place.tagIds.includes(c.id))

  const recommendLinks = links.filter(
    (l) => l.relation === 'recommended_by' && ((l.toType === 'place' && l.toId === place.id) || (l.fromType === 'place' && l.fromId === place.id))
  )
  const recommenders = recommendLinks
    .map((l) => {
      const personId = l.fromType === 'person' ? l.fromId : l.toId
      const person = people.find((p) => p.id === personId)
      return person ? { link: l, person } : null
    })
    .filter((x): x is { link: (typeof recommendLinks)[number]; person: (typeof people)[number] } => x !== null)

  if (editing) {
    return (
      <div style={{ padding: '4px 0' }}>
        <PlaceForm place={place} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <span style={{ width: 14, height: 14, borderRadius: 14, marginTop: 6, flex: 'none', background: category ? categoryColor(theme, category.colorIndex) : 'var(--faint2)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 24, color: 'var(--fgs)' }}>
            {place.name} {place.favorite && <span style={{ color: theme.accent }}>★</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--dim)' }}>
            {[category?.name, place.city, place.country].filter(Boolean).join(' · ')}
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
              {tags.map((t) => (
                <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 99, background: categoryColor(theme, t.colorIndex) + '22', color: 'var(--dim)', fontSize: 11 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 5, background: categoryColor(theme, t.colorIndex) }} />
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
          <button onClick={() => setEditing(true)} className="btn-outline" style={{ padding: '7px 12px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}>
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Remove ${place.name}? This can't be undone.`)) {
                removePlace(place.id)
                onClose()
              }
            }}
            className="btn-text"
            style={{ padding: '7px 10px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12.5 }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--dim2)' }}>
        {place.visited && <span>✓ Visited{place.visitCount > 1 ? ` (${place.visitCount}×)` : ''}</span>}
        {place.wantToVisit && <span>☆ Want to visit</span>}
        {place.rating && <span>{'★'.repeat(place.rating)}{'☆'.repeat(5 - place.rating)}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoRow label="Address" value={place.address} />
        <InfoRow label="Map" value={place.mapLink} />
        <InfoRow label="Phone" value={place.phone} />
        <InfoRow label="Website" value={place.website} />
        <InfoRow label="Hours" value={place.openingHours} />
        <InfoRow label="Last visited" value={place.lastVisitedDate} />
      </div>

      {place.notes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Notes</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg)' }}>{place.notes}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Recommended by</div>
        {recommenders.map(({ link, person }) => (
          <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg)' }}>
            <span style={{ flex: 1 }}>{person.fullName}</span>
            <button onClick={() => removeLink(link.id)} style={{ padding: '2px 6px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 12 }}>×</button>
          </div>
        ))}
        {people.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={addingRecommender}
              onChange={(e) => setAddingRecommender(e.target.value)}
              style={{ flex: 1, border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '6px 8px', fontSize: 12.5, color: 'var(--fg)' }}
            >
              <option value="">Add who recommended it…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!addingRecommender) return
                addLink({ fromType: 'person', fromId: addingRecommender, toType: 'place', toId: place.id, relation: 'recommended_by' })
                setAddingRecommender('')
              }}
              className="btn-outline"
              style={{ padding: '6px 10px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'transparent', color: 'var(--dim)', fontSize: 12 }}
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Collections</div>
        <CollectionPicker placeId={place.id} />
      </div>
    </div>
  )
}
