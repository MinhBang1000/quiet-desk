import { useStore } from '../store/useStore'

const FOCUS_MIN = 5
const FOCUS_MAX = 90
const FOCUS_STEP = 5
const BREAK_MIN = 3
const BREAK_MAX = 30
const BREAK_STEP = 1

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function StepperRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  step: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12.5, color: 'var(--dim)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => onChange(clamp(value - step, min, max))}
          className="icon-btn"
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--line2)',
            borderRadius: 'calc(var(--r) - 2px)',
            background: 'transparent',
            color: 'var(--dim)',
            fontSize: 13,
            lineHeight: 1,
          }}
        >
          −
        </button>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 12.5, color: 'var(--fgs)', minWidth: 26, textAlign: 'center' }}>
          {value}m
        </span>
        <button
          onClick={() => onChange(clamp(value + step, min, max))}
          className="icon-btn"
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--line2)',
            borderRadius: 'calc(var(--r) - 2px)',
            background: 'transparent',
            color: 'var(--dim)',
            fontSize: 13,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function TimerSettings() {
  const focusMinutes = useStore((s) => s.settings.focusMinutes)
  const breakMinutes = useStore((s) => s.settings.breakMinutes)
  const updateSettings = useStore((s) => s.updateSettings)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
        border: '1px solid var(--line)',
        borderRadius: 'calc(var(--r) + 1px)',
        background: 'var(--panel)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--fm)',
          fontSize: 9,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'var(--faint)',
        }}
      >
        Timer
      </div>
      <StepperRow
        label="Focus"
        value={focusMinutes}
        onChange={(focusMinutes) => updateSettings({ focusMinutes })}
        min={FOCUS_MIN}
        max={FOCUS_MAX}
        step={FOCUS_STEP}
      />
      <StepperRow
        label="Break"
        value={breakMinutes}
        onChange={(breakMinutes) => updateSettings({ breakMinutes })}
        min={BREAK_MIN}
        max={BREAK_MAX}
        step={BREAK_STEP}
      />
    </div>
  )
}
