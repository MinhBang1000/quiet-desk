import { categoryColor, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'
import type { Place } from '../types'

interface PlaceRowProps {
  place: Place
  active?: boolean
  onClick: () => void
}

export function PlaceRow({ place, active, onClick }: PlaceRowProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const categories = useStore((s) => s.categories)
  const category = categories.find((c) => c.id === place.categoryId)

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
      <span
        style={{
          width: 8, height: 8, borderRadius: 8, flex: 'none',
          background: category ? categoryColor(theme, category.colorIndex) : 'var(--faint2)',
        }}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 13.5, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {place.name}
          {place.favorite && <span style={{ color: theme.accent }}> ★</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[category?.name, place.city, place.wantToVisit && 'Want to visit'].filter(Boolean).join(' · ')}
        </div>
      </div>
    </button>
  )
}
