export function sectionHeader(label: string) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

export const inputStyle = {
  width: '100%',
  border: '1px solid var(--line2)',
  borderRadius: 'calc(var(--r) - 2px)',
  background: 'var(--bg)',
  padding: '10px 12px',
  fontSize: 14.5,
  color: 'var(--fg)',
  fontFamily: 'inherit',
} as const
