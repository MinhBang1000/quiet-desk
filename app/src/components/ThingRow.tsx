import { categoryColor, THEMES } from '../lib/themes'
import { resolveThingLocation } from '../lib/things'
import { useStore } from '../store/useStore'
import type { Thing } from '../types'

const STATUS_LABEL: Record<Thing['status'], string> = {
  owned: 'Owned',
  with_me: 'With me',
  stored: 'Stored',
  lent: 'Lent',
  borrowed: 'Borrowed',
  lost: 'Lost',
  sold: 'Sold',
  disposed: 'Disposed',
  wishlist: 'Wishlist',
}

interface ThingRowProps {
  thing: Thing
  active?: boolean
  onClick: () => void
}

export function ThingRow({ thing, active, onClick }: ThingRowProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const categories = useStore((s) => s.categories)
  const things = useStore((s) => s.things)
  const locations = useStore((s) => s.locations)
  const category = categories.find((c) => c.id === thing.categoryId)
  const where = resolveThingLocation(thing, things, locations)

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
      {thing.photoUrl ? (
        <img src={thing.photoUrl} alt="" style={{ width: 34, height: 34, borderRadius: 'calc(var(--r) - 3px)', objectFit: 'cover', flex: 'none' }} />
      ) : (
        <span
          style={{
            width: 34, height: 34, borderRadius: 'calc(var(--r) - 3px)', flex: 'none',
            background: category ? categoryColor(theme, category.colorIndex) + '33' : 'var(--track)',
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 13.5, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thing.name}</div>
        <div style={{ fontSize: 11, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {thing.status !== 'owned' && thing.status !== 'with_me' ? `${STATUS_LABEL[thing.status]} · ` : ''}
          {where}
        </div>
      </div>
    </button>
  )
}
