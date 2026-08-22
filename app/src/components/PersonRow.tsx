import { categoryColor, THEMES } from '../lib/themes'
import { initialsAvatar } from '../lib/image'
import { useStore } from '../store/useStore'
import type { Person } from '../types'

interface PersonRowProps {
  person: Person
  active?: boolean
  onClick: () => void
}

export function PersonRow({ person, active, onClick }: PersonRowProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const categories = useStore((s) => s.categories)
  const src = person.photoUrl || initialsAvatar(person.fullName, theme.accent, theme.ink)
  const primaryCategory = categories.find((c) => person.categoryIds.includes(c.id))

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        padding: '9px 10px',
        border: `1px solid ${active ? theme.accent + '66' : 'transparent'}`,
        borderRadius: 'var(--r)',
        background: active ? 'var(--hover)' : 'transparent',
        textAlign: 'left',
      }}
    >
      <img src={src} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 13.5, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {person.fullName}
          {person.favorite && <span style={{ color: theme.accent }}> ★</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--faint)' }}>
          {primaryCategory && (
            <span style={{ width: 5, height: 5, borderRadius: 5, background: categoryColor(theme, primaryCategory.colorIndex), flex: 'none' }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {person.relationship || primaryCategory?.name || person.organization || ''}
          </span>
        </div>
      </div>
    </button>
  )
}
