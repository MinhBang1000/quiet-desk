export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{label}</span>
      {children}
    </label>
  )
}

export function IconButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ flex: 'none', padding: '4px 7px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}
    >
      {children}
    </button>
  )
}
