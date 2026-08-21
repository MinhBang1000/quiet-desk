import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { api, ApiError, type AuthStatus } from '../api/client'

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--fg)',
      }}
    >
      <div
        style={{
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          padding: 30,
          border: '1px solid var(--line)',
          borderRadius: 'calc(var(--r) + 1px)',
          background: 'var(--panel)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontFamily: 'var(--fd)', fontSize: 23, letterSpacing: '-.01em', color: 'var(--fgs)' }}>Quiet Desk</div>
      <div
        style={{
          fontFamily: 'var(--fm)',
          fontSize: 9,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'var(--faint)',
        }}
      >
        focus · plan · learn
      </div>
    </div>
  )
}

function PinInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <input
      type="password"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 14px',
        border: '1px solid var(--line2)',
        borderRadius: 'var(--r)',
        background: 'var(--bg)',
        color: 'var(--fgs)',
        fontFamily: 'var(--fm)',
        fontSize: 18,
        letterSpacing: '.3em',
      }}
    />
  )
}

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="btn-primary"
      style={{
        padding: '12px 20px',
        border: 0,
        borderRadius: 'var(--r)',
        background: 'var(--accent)',
        color: 'var(--ink)',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  )
}

function ErrorText({ text }: { text: string | null }) {
  if (!text) return null
  return <div style={{ fontSize: 12.5, color: 'var(--accent)' }}>{text}</div>
}

function SetupForm({ onDone }: { onDone: () => void }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (pin.length < 6) {
      setError('PIN must be at least 6 characters.')
      return
    }
    if (pin !== confirm) {
      setError('PINs do not match.')
      return
    }
    setBusy(true)
    try {
      await api.setupPin(pin)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Wordmark />
      <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.5 }}>
        This is the first time opening Quiet Desk here. Set a PIN to protect your data — you'll need it every time you
        open this app.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PinInput value={pin} onChange={setPin} autoFocus />
        <PinInput value={confirm} onChange={setConfirm} />
      </div>
      <ErrorText text={error} />
      <SubmitButton label={busy ? 'Setting up…' : 'Set PIN'} disabled={busy} />
    </form>
  )
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.login(pin)
      onDone()
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const seconds = Math.ceil((err.retryAfterMs ?? 0) / 1000)
        setError(`Too many attempts. Try again in ${seconds}s.`)
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      }
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Wordmark />
      <PinInput value={pin} onChange={setPin} autoFocus />
      <ErrorText text={error} />
      <SubmitButton label={busy ? 'Checking…' : 'Unlock'} disabled={busy || !pin} />
    </form>
  )
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null)

  const refresh = () => {
    api
      .getAuthStatus()
      .then(setStatus)
      .catch(() => setStatus({ hasPin: false, authenticated: false }))
  }

  useEffect(() => {
    refresh()
  }, [])

  if (!status) return null

  if (!status.hasPin) {
    return (
      <Shell>
        <SetupForm onDone={refresh} />
      </Shell>
    )
  }

  if (!status.authenticated) {
    return (
      <Shell>
        <LoginForm onDone={refresh} />
      </Shell>
    )
  }

  return <>{children}</>
}
