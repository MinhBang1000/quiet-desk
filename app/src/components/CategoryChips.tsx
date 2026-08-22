import { categoryColor, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'
import type { CategoryModule } from '../types'

interface CategoryChipsProps {
  module: CategoryModule
  value: number[]
  onChange: (ids: number[]) => void
}

export function CategoryChips({ module, value, onChange }: CategoryChipsProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const allCategories = useStore((s) => s.categories)
  const categories = allCategories.filter((c) => c.module === module)

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  if (!categories.length) {
    return <div style={{ fontSize: 12, color: 'var(--faint)' }}>No categories yet — add some in Settings.</div>
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {categories.map((c) => {
        const on = value.includes(c.id)
        const color = categoryColor(theme, c.colorIndex)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              border: `1px solid ${on ? color : 'var(--line2)'}`,
              borderRadius: 99,
              background: on ? color + '22' : 'transparent',
              color: on ? 'var(--fgs)' : 'var(--dim)',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 6, background: color, flex: 'none' }} />
            {c.name}
          </button>
        )
      })}
    </div>
  )
}
