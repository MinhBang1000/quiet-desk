import { useState, type ReactNode } from 'react'
import { api } from '../api/client'
import { useHistory } from '../hooks/useHistory'
import { BP_MOBILE, useMediaQuery } from '../hooks/useMediaQuery'
import { computeStreak, dayStats } from '../lib/derived'
import { iso } from '../lib/date'
import { useStore } from '../store/useStore'
import type { View } from '../types'
import { RemindersToggle } from './RemindersToggle'
import { TagManager } from './TagManager'
import { ThemePicker } from './ThemePicker'
import { TimerSettings } from './TimerSettings'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const NAV: { id: View; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'today', label: 'Today' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'stats', label: 'Progress' },
  { id: 'portfolio', label: 'Portfolio' },
]

function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: compact ? 0 : '0 8px' }}>
      <div style={{ fontFamily: 'var(--fd)', fontSize: compact ? 19 : 23, letterSpacing: '-.01em', color: 'var(--fgs)' }}>
        Quiet Desk
      </div>
      {!compact && (
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
      )}
    </div>
  )
}

function Nav({ clock, openCount, horizontal }: { clock: string; openCount: number; horizontal?: boolean }) {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        gap: horizontal ? 6 : 2,
      }}
    >
      {NAV.map((n) => {
        const on = view === n.id
        return (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className="nav-btn"
            style={{
              display: 'flex',
              flex: horizontal ? 1 : 'none',
              alignItems: 'center',
              justifyContent: horizontal ? 'center' : 'space-between',
              gap: 8,
              padding: horizontal ? '8px 6px' : '9px 12px',
              border: 0,
              borderRadius: 'var(--r)',
              textAlign: 'left',
              fontSize: horizontal ? 12.5 : 14,
              fontWeight: 500,
              fontFamily: 'inherit',
              background: on ? 'var(--hover)' : 'transparent',
              color: on ? 'var(--fgs)' : 'var(--dim)',
              boxShadow: on ? (horizontal ? 'inset 0 -2px 0 var(--accent)' : 'inset 2px 0 0 var(--accent)') : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{n.label}</span>
            {n.id === 'focus' && (
              <span style={{ fontFamily: 'var(--fm)', fontSize: horizontal ? 10 : 11, opacity: 0.65 }}>{clock}</span>
            )}
            {n.id === 'today' && (
              <span style={{ fontFamily: 'var(--fm)', fontSize: horizontal ? 10 : 11, opacity: 0.65 }}>{openCount}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

function TodayCard({ todayMinutes, goalMinutes, streak, sessionsToday }: { todayMinutes: number; goalMinutes: number; streak: number; sessionsToday: number }) {
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
      <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        Today
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 26, color: 'var(--fgs)' }}>{todayMinutes}</span>
        <span style={{ fontSize: 12, color: 'var(--dim2)' }}>/ {goalMinutes} min focus</span>
      </div>
      <div style={{ height: 3, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, (todayMinutes / goalMinutes) * 100)}%`,
            background: 'var(--accent)',
            borderRadius: 3,
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: 'var(--dim2)' }}>
        {streak}-day streak · {sessionsToday} sessions
      </div>
    </div>
  )
}

function StylePicker() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div
        style={{
          fontFamily: 'var(--fm)',
          fontSize: 9,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'var(--faint)',
          padding: '0 8px',
        }}
      >
        Style
      </div>
      <ThemePicker />
    </div>
  )
}

function LogoutButton() {
  return (
    <button
      onClick={() => api.logout().finally(() => window.location.reload())}
      className="btn-text"
      style={{
        padding: '0 8px',
        border: 0,
        background: 'transparent',
        color: 'var(--faint)',
        fontSize: 11.5,
        textAlign: 'left',
      }}
    >
      Log out
    </button>
  )
}

function useSidebarData() {
  const remaining = useStore((s) => s.remaining)
  const tasks = useStore((s) => s.tasks)
  const goalMinutes = useStore((s) => s.settings.goalMinutes)
  const history = useHistory()

  const today = new Date()
  const t0 = iso(today)
  const todayMinutes = dayStats(history, t0).minutes
  const sessionsToday = useStore((s) => s.sessions).filter((sess) => iso(new Date(sess.startedAt)) === t0).length
  const streak = computeStreak(history, today)
  const openCount = tasks.filter((t) => !t.done).length
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const clock = `${pad(mm)}:${pad(ss)}`

  return { todayMinutes, goalMinutes, sessionsToday, streak, openCount, clock }
}

function DesktopSidebar() {
  const { todayMinutes, goalMinutes, sessionsToday, streak, openCount, clock } = useSidebarData()

  return (
    <aside
      style={{
        width: 222,
        flex: 'none',
        borderRight: '1px solid var(--line)',
        padding: '26px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      <Wordmark />
      <Nav clock={clock} openCount={openCount} />
      <TodayCard todayMinutes={todayMinutes} goalMinutes={goalMinutes} streak={streak} sessionsToday={sessionsToday} />
      <TimerSettings />
      <TagManager />
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <RemindersToggle />
        <StylePicker />
        <LogoutButton />
      </div>
    </aside>
  )
}

function MobileMenuRow({ children }: { children: ReactNode }) {
  return <div style={{ padding: '0 14px' }}>{children}</div>
}

function MobileSidebar() {
  const { todayMinutes, goalMinutes, sessionsToday, streak, openCount, clock } = useSidebarData()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
        <Wordmark compact />
        <button
          onClick={() => setOpen((v) => !v)}
          className="icon-btn"
          style={{
            padding: '6px 12px',
            border: '1px solid var(--line2)',
            borderRadius: 'var(--r)',
            background: open ? 'var(--hover)' : 'transparent',
            color: 'var(--dim)',
            fontSize: 12,
          }}
        >
          {open ? 'Close' : 'More'}
        </button>
      </div>
      <div style={{ padding: '0 14px 10px' }}>
        <Nav clock={clock} openCount={openCount} horizontal />
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0 18px', borderTop: '1px solid var(--line)' }}>
          <MobileMenuRow>
            <div style={{ paddingTop: 16 }}>
              <TodayCard todayMinutes={todayMinutes} goalMinutes={goalMinutes} streak={streak} sessionsToday={sessionsToday} />
            </div>
          </MobileMenuRow>
          <MobileMenuRow>
            <TimerSettings />
          </MobileMenuRow>
          <MobileMenuRow>
            <TagManager />
          </MobileMenuRow>
          <MobileMenuRow>
            <RemindersToggle />
          </MobileMenuRow>
          <MobileMenuRow>
            <StylePicker />
          </MobileMenuRow>
          <MobileMenuRow>
            <LogoutButton />
          </MobileMenuRow>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const isMobile = useMediaQuery(BP_MOBILE)
  return isMobile ? <MobileSidebar /> : <DesktopSidebar />
}
