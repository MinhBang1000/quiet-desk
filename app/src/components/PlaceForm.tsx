import { useState } from 'react'
import { CategoryChips } from './CategoryChips'
import { CategoryPicker } from './CategoryPicker'
import { Field } from './FormKit'
import { inputStyle, sectionHeader } from '../lib/formKit'
import { useStore } from '../store/useStore'
import type { Place } from '../types'

const blankDraft = {
  name: '', categoryId: null as number | null, address: '', mapLink: '', phone: '', website: '',
  openingHours: '', rating: null as number | null, visited: false, wantToVisit: false, favorite: false,
  notes: '', lastVisitedDate: '' as string, visitCount: 0, city: '', country: '', tagIds: [] as number[],
}

type Draft = typeof blankDraft

function fromPlace(place: Place | null): Draft {
  if (!place) return { ...blankDraft }
  return {
    name: place.name, categoryId: place.categoryId, address: place.address, mapLink: place.mapLink,
    phone: place.phone, website: place.website, openingHours: place.openingHours, rating: place.rating,
    visited: place.visited, wantToVisit: place.wantToVisit, favorite: place.favorite, notes: place.notes,
    lastVisitedDate: place.lastVisitedDate ?? '', visitCount: place.visitCount, city: place.city,
    country: place.country, tagIds: place.tagIds,
  }
}

interface PlaceFormProps {
  place: Place | null
  onDone: (place: Place) => void
  onCancel: () => void
}

export function PlaceForm({ place, onDone, onCancel }: PlaceFormProps) {
  const addPlace = useStore((s) => s.addPlace)
  const updatePlace = useStore((s) => s.updatePlace)
  const [draft, setDraft] = useState<Draft>(() => fromPlace(place))

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    const name = draft.name.trim()
    if (!name) return
    const payload = { ...draft, name, lastVisitedDate: draft.lastVisitedDate || null }
    if (place) {
      await updatePlace(place.id, payload)
      onDone({ ...place, ...payload })
    } else {
      const created = await addPlace(payload)
      onDone(created)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 620 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Identity')}
        <Field label="Name">
          <input value={draft.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} autoFocus />
        </Field>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Category">
            <CategoryPicker module="place" value={draft.categoryId} onChange={(v) => set('categoryId', v)} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg)', paddingBottom: 10 }}>
            <input type="checkbox" checked={draft.favorite} onChange={(e) => set('favorite', e.target.checked)} />
            Favorite
          </label>
        </div>
        <Field label="Tags">
          <CategoryChips module="place_tag" value={draft.tagIds} onChange={(v) => set('tagIds', v)} />
        </Field>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Location & contact')}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px' }}>
            <Field label="Address">
              <input value={draft.address} onChange={(e) => set('address', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <Field label="Map link">
              <input value={draft.mapLink} onChange={(e) => set('mapLink', e.target.value)} style={inputStyle} placeholder="https://maps.google.com/…" />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="City">
              <input value={draft.city} onChange={(e) => set('city', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Country">
              <input value={draft.country} onChange={(e) => set('country', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Phone">
              <input value={draft.phone} onChange={(e) => set('phone', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Field label="Website">
              <input value={draft.website} onChange={(e) => set('website', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Opening hours">
              <input value={draft.openingHours} onChange={(e) => set('openingHours', e.target.value)} style={inputStyle} placeholder="Mon-Fri 9-5" />
            </Field>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Your experience')}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg)' }}>
            <input type="checkbox" checked={draft.visited} onChange={(e) => set('visited', e.target.checked)} />
            Visited
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg)' }}>
            <input type="checkbox" checked={draft.wantToVisit} onChange={(e) => set('wantToVisit', e.target.checked)} />
            Want to visit
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 120px' }}>
            <Field label="Rating (1-5)">
              <input
                type="number" min={1} max={5}
                value={draft.rating ?? ''}
                onChange={(e) => set('rating', e.target.value ? Number(e.target.value) : null)}
                style={inputStyle}
              />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Last visited">
              <input type="date" value={draft.lastVisitedDate} onChange={(e) => set('lastVisitedDate', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '0 0 120px' }}>
            <Field label="Visit count">
              <input type="number" min={0} value={draft.visitCount} onChange={(e) => set('visitCount', Number(e.target.value) || 0)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <Field label="Notes — why it's worth remembering, what to order, what to avoid, who recommended it">
          <textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
      </section>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={save}
          className="btn-primary"
          style={{ padding: '11px 22px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600 }}
        >
          {place ? 'Save' : 'Add place'}
        </button>
        <button onClick={onCancel} className="btn-text" style={{ padding: '11px 14px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 13.5 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
