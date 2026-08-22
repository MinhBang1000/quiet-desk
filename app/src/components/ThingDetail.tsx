import { useState } from 'react'
import { ThingForm } from './ThingForm'
import { categoryColor, THEMES } from '../lib/themes'
import { resolveThingLocation } from '../lib/things'
import { useStore } from '../store/useStore'
import type { Thing } from '../types'

const STATUS_LABEL: Record<Thing['status'], string> = {
  owned: 'Owned', with_me: 'With me', stored: 'Stored', lent: 'Lent', borrowed: 'Borrowed',
  lost: 'Lost', sold: 'Sold', disposed: 'Disposed', wishlist: 'Wishlist',
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
      <span style={{ flex: '0 0 130px', color: 'var(--faint)' }}>{label}</span>
      <span style={{ color: 'var(--fg)' }}>{value}</span>
    </div>
  )
}

interface ThingDetailProps {
  thing: Thing
  onClose: () => void
}

export function ThingDetail({ thing, onClose }: ThingDetailProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const categories = useStore((s) => s.categories)
  const things = useStore((s) => s.things)
  const locations = useStore((s) => s.locations)
  const people = useStore((s) => s.people)
  const links = useStore((s) => s.links)
  const removeThing = useStore((s) => s.removeThing)
  const addLink = useStore((s) => s.addLink)
  const removeLink = useStore((s) => s.removeLink)
  const [editing, setEditing] = useState(false)
  const [addingRelated, setAddingRelated] = useState('')

  const category = categories.find((c) => c.id === thing.categoryId)
  const where = resolveThingLocation(thing, things, locations)
  const loanPerson = thing.loanPersonId ? people.find((p) => p.id === thing.loanPersonId) : null

  const relatedLinks = links.filter(
    (l) => (l.fromType === 'thing' && l.fromId === thing.id) || (l.toType === 'thing' && l.toId === thing.id)
  )
  const relatedThings = relatedLinks
    .map((l) => {
      const otherId = l.fromId === thing.id ? l.toId : l.fromId;
      const otherType = l.fromId === thing.id ? l.toType : l.fromType
      if (otherType !== 'thing') return null
      const t = things.find((x) => x.id === otherId)
      return t ? { link: l, thing: t } : null
    })
    .filter((x): x is { link: (typeof relatedLinks)[number]; thing: Thing } => x !== null)

  const candidateThings = things.filter((t) => t.id !== thing.id && !relatedThings.some((r) => r.thing.id === t.id))

  if (editing) {
    return (
      <div style={{ padding: '4px 0' }}>
        <ThingForm thing={thing} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {thing.photoUrl ? (
          <img src={thing.photoUrl} alt="" style={{ width: 76, height: 76, borderRadius: 'calc(var(--r) + 2px)', objectFit: 'cover', flex: 'none' }} />
        ) : (
          <span style={{ width: 76, height: 76, borderRadius: 'calc(var(--r) + 2px)', flex: 'none', background: category ? categoryColor(theme, category.colorIndex) + '33' : 'var(--track)' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 24, color: 'var(--fgs)' }}>{thing.name}</div>
          <div style={{ fontSize: 13, color: 'var(--dim)' }}>
            {[STATUS_LABEL[thing.status], category?.name, where].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flex: 'none' }}>
          <button onClick={() => setEditing(true)} className="btn-outline" style={{ padding: '7px 12px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}>
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Remove ${thing.name}? This can't be undone.`)) {
                removeThing(thing.id)
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

      {loanPerson && (
        <div style={{ fontSize: 13, color: 'var(--fg)' }}>
          {thing.status === 'lent' ? 'Lent to' : 'Borrowed from'} <strong>{loanPerson.fullName}</strong>
          {thing.loanSince && ` · since ${thing.loanSince}`}
          {thing.loanDue && ` · due ${thing.loanDue}`}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoRow label="Brand / model" value={[thing.brand, thing.model].filter(Boolean).join(' ')} />
        <InfoRow label="Serial number" value={thing.serialNumber} />
        <InfoRow label="Quantity" value={thing.quantity !== 1 ? thing.quantity : null} />
        <InfoRow label="Purchased" value={[thing.purchaseDate, thing.purchaseLocation].filter(Boolean).join(' · ')} />
        <InfoRow label="Price" value={thing.purchasePrice != null ? `${thing.purchasePrice} ${thing.currency}` : null} />
        <InfoRow label="Warranty until" value={thing.warrantyExpires} />
      </div>

      {thing.notes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Notes</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg)' }}>{thing.notes}</div>
        </div>
      )}

      {thing.attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Attachments</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {thing.attachments.map((a, i) => (
              <a key={i} href={a.dataUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 72 }}>
                <img src={a.dataUrl} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'calc(var(--r) - 3px)', border: '1px solid var(--line2)' }} />
                <span style={{ fontSize: 10.5, color: 'var(--faint)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{a.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Related things</div>
        {relatedThings.map(({ link, thing: t }) => (
          <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg)' }}>
            <span style={{ flex: 1 }}>{t.name}</span>
            <button onClick={() => removeLink(link.id)} style={{ padding: '2px 6px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 12 }}>
              ×
            </button>
          </div>
        ))}
        {candidateThings.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={addingRelated}
              onChange={(e) => setAddingRelated(e.target.value)}
              style={{ flex: 1, border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '6px 8px', fontSize: 12.5, color: 'var(--fg)' }}
            >
              <option value="">Add a related thing…</option>
              {candidateThings.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!addingRelated) return
                addLink({ fromType: 'thing', fromId: thing.id, toType: 'thing', toId: addingRelated, relation: 'accessory' })
                setAddingRelated('')
              }}
              className="btn-outline"
              style={{ padding: '6px 10px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'transparent', color: 'var(--dim)', fontSize: 12 }}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
