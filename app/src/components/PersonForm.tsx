import { useState } from 'react'
import { CategoryChips } from './CategoryChips'
import { Field } from './FormKit'
import { PhotoPicker } from './PhotoPicker'
import { inputStyle, sectionHeader } from '../lib/formKit'
import { useStore } from '../store/useStore'
import type { Person } from '../types'

const blankDraft = {
  fullName: '',
  nickname: '',
  photoUrl: '',
  relationship: '',
  organization: '',
  position: '',
  phone: '',
  email: '',
  otherContact: '',
  website: '',
  birthday: '' as string,
  city: '',
  country: '',
  notes: '',
  interests: '',
  likes: '',
  dislikes: '',
  foodPreferences: '',
  giftIdeas: '',
  howWeMet: '',
  firstMetDate: '' as string,
  lastContactedDate: '' as string,
  favorite: false,
  categoryIds: [] as number[],
}

type Draft = typeof blankDraft

function fromPerson(person: Person | null): Draft {
  if (!person) return { ...blankDraft }
  return {
    fullName: person.fullName,
    nickname: person.nickname,
    photoUrl: person.photoUrl,
    relationship: person.relationship,
    organization: person.organization,
    position: person.position,
    phone: person.phone,
    email: person.email,
    otherContact: person.otherContact,
    website: person.website,
    birthday: person.birthday ?? '',
    city: person.city,
    country: person.country,
    notes: person.notes,
    interests: person.interests,
    likes: person.likes,
    dislikes: person.dislikes,
    foodPreferences: person.foodPreferences,
    giftIdeas: person.giftIdeas,
    howWeMet: person.howWeMet,
    firstMetDate: person.firstMetDate ?? '',
    lastContactedDate: person.lastContactedDate ?? '',
    favorite: person.favorite,
    categoryIds: person.categoryIds,
  }
}

interface PersonFormProps {
  person: Person | null
  onDone: (person: Person) => void
  onCancel: () => void
}

export function PersonForm({ person, onDone, onCancel }: PersonFormProps) {
  const addPerson = useStore((s) => s.addPerson)
  const updatePerson = useStore((s) => s.updatePerson)
  const [draft, setDraft] = useState<Draft>(() => fromPerson(person))

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    const fullName = draft.fullName.trim()
    if (!fullName) return
    const payload = {
      ...draft,
      fullName,
      birthday: draft.birthday || null,
      firstMetDate: draft.firstMetDate || null,
      lastContactedDate: draft.lastContactedDate || null,
    }
    if (person) {
      await updatePerson(person.id, payload)
      onDone({ ...person, ...payload })
    } else {
      const created = await addPerson(payload)
      onDone(created)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 640 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Identity')}
        <PhotoPicker photoUrl={draft.photoUrl} fallbackName={draft.fullName} size={96} onChange={(v) => set('photoUrl', v)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px' }}>
            <Field label="Full name">
              <input value={draft.fullName} onChange={(e) => set('fullName', e.target.value)} style={inputStyle} autoFocus />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Nickname">
              <input value={draft.nickname} onChange={(e) => set('nickname', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Field label="Relationship">
              <input value={draft.relationship} onChange={(e) => set('relationship', e.target.value)} style={inputStyle} placeholder="e.g. Friend, Advisor" />
            </Field>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg)', alignSelf: 'flex-end', paddingBottom: 10 }}>
            <input type="checkbox" checked={draft.favorite} onChange={(e) => set('favorite', e.target.checked)} />
            Favorite
          </label>
        </div>
        <Field label="Categories">
          <CategoryChips module="person" value={draft.categoryIds} onChange={(ids) => set('categoryIds', ids)} />
        </Field>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Contact')}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Field label="Organization">
              <input value={draft.organization} onChange={(e) => set('organization', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Position / role">
              <input value={draft.position} onChange={(e) => set('position', e.target.value)} style={inputStyle} />
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
            <Field label="Email">
              <input value={draft.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <Field label="LINE / Messenger / other">
              <input value={draft.otherContact} onChange={(e) => set('otherContact', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Field label="Website / LinkedIn">
              <input value={draft.website} onChange={(e) => set('website', e.target.value)} style={inputStyle} />
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
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Personal')}
        <Field label="Notes">
          <textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <Field label="Interests">
              <input value={draft.interests} onChange={(e) => set('interests', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <Field label="Likes">
              <input value={draft.likes} onChange={(e) => set('likes', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <Field label="Dislikes">
              <input value={draft.dislikes} onChange={(e) => set('dislikes', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <Field label="Food preferences">
              <input value={draft.foodPreferences} onChange={(e) => set('foodPreferences', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <Field label="Gift ideas">
          <input value={draft.giftIdeas} onChange={(e) => set('giftIdeas', e.target.value)} style={inputStyle} />
        </Field>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('History & dates')}
        <Field label="How we met">
          <input value={draft.howWeMet} onChange={(e) => set('howWeMet', e.target.value)} style={inputStyle} />
        </Field>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="First met">
              <input type="date" value={draft.firstMetDate} onChange={(e) => set('firstMetDate', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Birthday">
              <input type="date" value={draft.birthday} onChange={(e) => set('birthday', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Last contacted">
              <input type="date" value={draft.lastContactedDate} onChange={(e) => set('lastContactedDate', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={save}
          className="btn-primary"
          style={{ padding: '11px 22px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600 }}
        >
          {person ? 'Save' : 'Add person'}
        </button>
        <button
          onClick={onCancel}
          className="btn-text"
          style={{ padding: '11px 14px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 13.5 }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
