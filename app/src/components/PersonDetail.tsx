import { useState } from 'react'
import { PersonForm } from './PersonForm'
import { categoryColor, THEMES } from '../lib/themes'
import { initialsAvatar } from '../lib/image'
import { useStore } from '../store/useStore'
import type { Person } from '../types'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
      <span style={{ flex: '0 0 110px', color: 'var(--faint)' }}>{label}</span>
      <span style={{ color: 'var(--fg)' }}>{value}</span>
    </div>
  )
}

interface PersonDetailProps {
  person: Person
  onClose: () => void
}

export function PersonDetail({ person, onClose }: PersonDetailProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const categories = useStore((s) => s.categories)
  const things = useStore((s) => s.things)
  const removePerson = useStore((s) => s.removePerson)
  const [editing, setEditing] = useState(false)

  const myCategories = categories.filter((c) => person.categoryIds.includes(c.id))
  const lentThings = things.filter((t) => t.loanPersonId === person.id)
  const src = person.photoUrl || initialsAvatar(person.fullName, theme.accent, theme.ink)

  if (editing) {
    return (
      <div style={{ padding: '4px 0' }}>
        <PersonForm person={person} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={src} alt="" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 24, color: 'var(--fgs)' }}>
            {person.fullName} {person.favorite && <span style={{ color: theme.accent }}>★</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--dim)' }}>
            {[person.relationship, person.organization && person.position ? `${person.position} @ ${person.organization}` : person.organization].filter(Boolean).join(' · ')}
          </div>
          {myCategories.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
              {myCategories.map((c) => (
                <span
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 99,
                    background: categoryColor(theme, c.colorIndex) + '22', color: 'var(--dim)', fontSize: 11,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 5, background: categoryColor(theme, c.colorIndex) }} />
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flex: 'none' }}>
          <button onClick={() => setEditing(true)} className="btn-outline" style={{ padding: '7px 12px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}>
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Remove ${person.fullName} from People? This can't be undone.`)) {
                removePerson(person.id)
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

      {person.howWeMet && (
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg)' }}>{person.howWeMet}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoRow label="Phone" value={person.phone} />
        <InfoRow label="Email" value={person.email} />
        <InfoRow label="Other contact" value={person.otherContact} />
        <InfoRow label="Website" value={person.website} />
        <InfoRow label="City / country" value={[person.city, person.country].filter(Boolean).join(', ') || undefined} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoRow label="Nickname" value={person.nickname} />
        <InfoRow label="Interests" value={person.interests} />
        <InfoRow label="Likes" value={person.likes} />
        <InfoRow label="Dislikes" value={person.dislikes} />
        <InfoRow label="Food" value={person.foodPreferences} />
        <InfoRow label="Gift ideas" value={person.giftIdeas} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InfoRow label="First met" value={person.firstMetDate} />
        <InfoRow label="Birthday" value={person.birthday} />
        <InfoRow label="Last contacted" value={person.lastContactedDate} />
      </div>

      {person.notes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Notes</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg)' }}>{person.notes}</div>
        </div>
      )}

      {lentThings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Lent to them</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lentThings.map((t) => (
              <div key={t.id} style={{ fontSize: 13, color: 'var(--fg)' }}>
                {t.name} {t.loanSince && <span style={{ color: 'var(--faint)' }}>· since {t.loanSince}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
