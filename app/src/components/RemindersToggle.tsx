import { notificationsSupported } from '../lib/notify'
import { useStore } from '../store/useStore'

export function RemindersToggle() {
  const enabled = useStore((s) => s.notificationsEnabled)
  const enableNotifications = useStore((s) => s.enableNotifications)

  if (!notificationsSupported()) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px' }}>
      <button
        onClick={enableNotifications}
        disabled={enabled}
        className="btn-text"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: 0,
          border: 0,
          background: 'transparent',
          color: enabled ? 'var(--ok)' : 'var(--dim)',
          fontSize: 12,
          textAlign: 'left',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 6, background: enabled ? 'var(--ok)' : 'var(--faint2)' }} />
        {enabled ? 'Reminders on' : 'Enable reminders'}
      </button>
      <span style={{ fontSize: 10.5, color: 'var(--faint2)', lineHeight: 1.4 }}>
        Only works while this tab is open — nothing fires if the app or browser is closed.
      </span>
    </div>
  )
}
