import { useEffect } from 'react'

interface ToastProps {
  message: string
  onDone: () => void
}

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 28,
        transform: 'translateX(-50%)',
        zIndex: 200,
        padding: '11px 18px',
        borderRadius: 'var(--r)',
        border: '1px solid var(--line2)',
        background: 'var(--panel)',
        color: 'var(--fgs)',
        fontSize: 13,
        boxShadow: '0 12px 32px rgba(0,0,0,.35)',
      }}
    >
      {message}
    </div>
  )
}
