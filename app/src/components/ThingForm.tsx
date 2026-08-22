import { useRef, useState } from 'react'
import { CategoryPicker } from './CategoryPicker'
import { Field, IconButton } from './FormKit'
import { LocationPicker } from './LocationPicker'
import { PhotoPicker } from './PhotoPicker'
import { inputStyle, sectionHeader } from '../lib/formKit'
import { fileToResizedDataUrl } from '../lib/image'
import { useStore } from '../store/useStore'
import type { Thing, ThingAttachment, ThingStatus } from '../types'

const STATUS_OPTIONS: { id: ThingStatus; label: string }[] = [
  { id: 'owned', label: 'Owned' },
  { id: 'with_me', label: 'With me' },
  { id: 'stored', label: 'Stored' },
  { id: 'lent', label: 'Lent' },
  { id: 'borrowed', label: 'Borrowed' },
  { id: 'lost', label: 'Lost' },
  { id: 'sold', label: 'Sold' },
  { id: 'disposed', label: 'Disposed' },
  { id: 'wishlist', label: 'Wishlist' },
]

const blankDraft = {
  name: '',
  photoUrl: '',
  categoryId: null as number | null,
  brand: '',
  model: '',
  serialNumber: '',
  quantity: 1,
  notes: '',
  purchaseDate: '',
  purchaseLocation: '',
  purchasePrice: '' as string,
  currency: 'TWD',
  warrantyExpires: '',
  attachments: [] as ThingAttachment[],
  status: 'owned' as ThingStatus,
  locationId: null as string | null,
  containerId: null as string | null,
  loanPersonId: null as string | null,
  loanSince: '',
  loanDue: '',
}

type Draft = typeof blankDraft

function fromThing(thing: Thing | null): Draft {
  if (!thing) return { ...blankDraft }
  return {
    name: thing.name,
    photoUrl: thing.photoUrl,
    categoryId: thing.categoryId,
    brand: thing.brand,
    model: thing.model,
    serialNumber: thing.serialNumber,
    quantity: thing.quantity,
    notes: thing.notes,
    purchaseDate: thing.purchaseDate ?? '',
    purchaseLocation: thing.purchaseLocation,
    purchasePrice: thing.purchasePrice != null ? String(thing.purchasePrice) : '',
    currency: thing.currency,
    warrantyExpires: thing.warrantyExpires ?? '',
    attachments: thing.attachments,
    status: thing.status,
    locationId: thing.locationId,
    containerId: thing.containerId,
    loanPersonId: thing.loanPersonId,
    loanSince: thing.loanSince ?? '',
    loanDue: thing.loanDue ?? '',
  }
}

function AttachmentsEditor({ attachments, onChange }: { attachments: ThingAttachment[]; onChange: (a: ThingAttachment[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {attachments.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={a.dataUrl} alt="" style={{ width: 32, height: 32, borderRadius: 'calc(var(--r) - 4px)', objectFit: 'cover', flex: 'none', border: '1px solid var(--line2)' }} />
          <input
            value={a.label}
            onChange={(e) => onChange(attachments.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            placeholder="e.g. Receipt, Warranty, Manual"
            style={{ ...inputStyle, flex: 1 }}
          />
          <IconButton onClick={() => onChange(attachments.filter((_, j) => j !== i))} title="Remove attachment">
            ×
          </IconButton>
        </div>
      ))}
      <button
        onClick={() => fileRef.current?.click()}
        className="btn-text"
        style={{ alignSelf: 'flex-start', padding: '4px 0', border: 0, background: 'transparent', color: 'var(--dim2)', fontSize: 12.5 }}
      >
        + Add attachment (receipt, warranty, manual…)
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          const added = await Promise.all(
            files.map(async (f) => ({ label: f.name.replace(/\.[^.]+$/, ''), dataUrl: await fileToResizedDataUrl(f, 1200, 0.82) }))
          )
          onChange([...attachments, ...added])
        }}
      />
    </div>
  )
}

interface ThingFormProps {
  thing: Thing | null
  onDone: (thing: Thing) => void
  onCancel: () => void
}

export function ThingForm({ thing, onDone, onCancel }: ThingFormProps) {
  const addThing = useStore((s) => s.addThing)
  const updateThing = useStore((s) => s.updateThing)
  const things = useStore((s) => s.things)
  const people = useStore((s) => s.people)
  const [draft, setDraft] = useState<Draft>(() => fromThing(thing))
  const [placement, setPlacement] = useState<'location' | 'container'>(draft.containerId ? 'container' : 'location')

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const otherThings = things.filter((t) => t.id !== thing?.id)
  const showLoanFields = draft.status === 'lent' || draft.status === 'borrowed'

  const save = async () => {
    const name = draft.name.trim()
    if (!name) return
    const payload = {
      ...draft,
      name,
      purchaseDate: draft.purchaseDate || null,
      warrantyExpires: draft.warrantyExpires || null,
      purchasePrice: draft.purchasePrice.trim() ? Number(draft.purchasePrice) : null,
      locationId: placement === 'location' ? draft.locationId : null,
      containerId: placement === 'container' ? draft.containerId : null,
      loanPersonId: showLoanFields ? draft.loanPersonId : null,
      loanSince: showLoanFields ? draft.loanSince || null : null,
      loanDue: showLoanFields ? draft.loanDue || null : null,
    }
    if (thing) {
      await updateThing(thing.id, payload)
      onDone({ ...thing, ...payload })
    } else {
      const created = await addThing(payload)
      onDone(created)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 640 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Identity')}
        <PhotoPicker photoUrl={draft.photoUrl} fallbackName={draft.name} size={96} onChange={(v) => set('photoUrl', v)} />
        <Field label="Name">
          <input value={draft.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} autoFocus />
        </Field>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Field label="Category">
            <CategoryPicker module="thing" value={draft.categoryId} onChange={(v) => set('categoryId', v)} />
          </Field>
          <div style={{ flex: '0 0 90px' }}>
            <Field label="Quantity">
              <input type="number" min={1} value={draft.quantity} onChange={(e) => set('quantity', Number(e.target.value) || 1)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Brand">
              <input value={draft.brand} onChange={(e) => set('brand', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Model">
              <input value={draft.model} onChange={(e) => set('model', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Serial number">
              <input value={draft.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Status & location')}
        <Field label="Status">
          <select value={draft.status} onChange={(e) => set('status', e.target.value as ThingStatus)} style={inputStyle}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </Field>

        {showLoanFields && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <Field label={draft.status === 'lent' ? 'Lent to' : 'Borrowed from'}>
                <select value={draft.loanPersonId ?? ''} onChange={(e) => set('loanPersonId', e.target.value || null)} style={inputStyle}>
                  <option value="">Choose a person…</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <Field label="Since">
                <input type="date" value={draft.loanSince} onChange={(e) => set('loanSince', e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <Field label="Due back (optional)">
                <input type="date" value={draft.loanDue} onChange={(e) => set('loanDue', e.target.value)} style={inputStyle} />
              </Field>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--dim)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" checked={placement === 'location'} onChange={() => setPlacement('location')} />
            Physical location
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="radio" checked={placement === 'container'} onChange={() => setPlacement('container')} />
            Inside another thing
          </label>
        </div>
        {placement === 'location' ? (
          <LocationPicker value={draft.locationId} onChange={(id) => set('locationId', id)} />
        ) : (
          <select value={draft.containerId ?? ''} onChange={(e) => set('containerId', e.target.value || null)} style={inputStyle}>
            <option value="">Choose a container…</option>
            {otherThings.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Purchase')}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Purchase date">
              <input type="date" value={draft.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Purchase location">
              <input value={draft.purchaseLocation} onChange={(e) => set('purchaseLocation', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <Field label="Price">
              <input type="number" value={draft.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '0 0 100px' }}>
            <Field label="Currency">
              <input value={draft.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <Field label="Warranty expires">
              <input type="date" value={draft.warrantyExpires} onChange={(e) => set('warrantyExpires', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Notes & attachments')}
        <Field label="Notes">
          <textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        </Field>
        <AttachmentsEditor attachments={draft.attachments} onChange={(a) => set('attachments', a)} />
      </section>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={save}
          className="btn-primary"
          style={{ padding: '11px 22px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600 }}
        >
          {thing ? 'Save' : 'Add thing'}
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
