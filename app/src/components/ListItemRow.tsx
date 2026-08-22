import { useStore } from '../store/useStore'
import type { ListEntity, ListItem } from '../types'

interface ListItemRowProps {
  item: ListItem
  style: ListEntity['style']
  onMove?: (dir: -1 | 1) => void
}

export function ListItemRow({ item, style, onMove }: ListItemRowProps) {
  const people = useStore((s) => s.people)
  const places = useStore((s) => s.places)
  const things = useStore((s) => s.things)
  const updateListItem = useStore((s) => s.updateListItem)
  const removeListItem = useStore((s) => s.removeListItem)
  const convertListItem = useStore((s) => s.convertListItem)
  const selectPerson = useStore((s) => s.selectPerson)
  const selectPlace = useStore((s) => s.selectPlace)
  const selectThing = useStore((s) => s.selectThing)
  const setView = useStore((s) => s.setView)

  const isChecklist = style === 'checklist' || style === 'reusable_checklist'
  const isRanked = style === 'ranked'

  const linkedName =
    item.linkType === 'person' ? people.find((p) => p.id === item.linkId)?.fullName
    : item.linkType === 'place' ? places.find((p) => p.id === item.linkId)?.name
    : item.linkType === 'thing' ? things.find((t) => t.id === item.linkId)?.name
    : item.convertedToType === 'place' ? places.find((p) => p.id === item.convertedToId)?.name
    : item.convertedToType === 'thing' ? things.find((t) => t.id === item.convertedToId)?.name
    : undefined

  const openLinked = () => {
    if (item.linkType === 'person' && item.linkId) { selectPerson(item.linkId); setView('people'); return }
    if (item.linkType === 'place' && item.linkId) { selectPlace(item.linkId); setView('places'); return }
    if (item.linkType === 'thing' && item.linkId) { selectThing(item.linkId); setView('things'); return }
    if (item.convertedToType === 'place' && item.convertedToId) { selectPlace(item.convertedToId); setView('places'); return }
    if (item.convertedToType === 'thing' && item.convertedToId) { selectThing(item.convertedToId); setView('things') }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderBottom: '1px solid var(--line)' }}>
      {isChecklist ? (
        <button
          onClick={() => updateListItem(item.id, { completed: !item.completed })}
          style={{
            flex: 'none', width: 16, height: 16, borderRadius: 'calc(var(--r) / 2)', cursor: 'pointer',
            border: `1px solid ${item.completed ? 'var(--accent)' : 'var(--faint2)'}`,
            background: item.completed ? 'var(--accent)' : 'transparent',
          }}
        />
      ) : (
        <span style={{ flex: 'none', width: 16, textAlign: 'center', fontSize: 12, color: 'var(--faint)' }}>•</span>
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 13.5, color: item.completed ? 'var(--faint)' : 'var(--fg)', textDecoration: item.completed ? 'line-through' : 'none' }}>
          {item.text}
        </div>
        {item.description && <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{item.description}</div>}
        {linkedName && (
          <button onClick={openLinked} style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: 'var(--accent)', fontSize: 11 }}>
            → {linkedName}
          </button>
        )}
      </div>

      {isRanked && onMove && (
        <div style={{ display: 'flex', flex: 'none' }}>
          <button onClick={() => onMove(-1)} style={{ padding: '2px 5px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12 }}>↑</button>
          <button onClick={() => onMove(1)} style={{ padding: '2px 5px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12 }}>↓</button>
        </div>
      )}

      {!item.linkType && !item.convertedToType && (
        <div style={{ display: 'flex', flex: 'none', gap: 4 }}>
          <button
            onClick={() => convertListItem(item.id, 'place')}
            title="Convert to a Place"
            style={{ padding: '3px 6px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 4px)', background: 'transparent', color: 'var(--faint)', fontSize: 10.5 }}
          >
            → Place
          </button>
          <button
            onClick={() => convertListItem(item.id, 'thing')}
            title="Convert to a Thing"
            style={{ padding: '3px 6px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 4px)', background: 'transparent', color: 'var(--faint)', fontSize: 10.5 }}
          >
            → Thing
          </button>
        </div>
      )}

      <button onClick={() => removeListItem(item.id)} style={{ flex: 'none', padding: '2px 6px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}>
        ×
      </button>
    </div>
  )
}
