import { TaskRow } from '../components/TaskRow'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { iso } from '../lib/date'
import { THEMES } from '../lib/themes'
import { BREAK_IDEAS, useStore } from '../store/useStore'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function FocusView() {
  const mode = useStore((s) => s.mode)
  const remaining = useStore((s) => s.remaining)
  const running = useStore((s) => s.running)
  const theme = useStore((s) => THEMES[s.theme])
  const activeId = useStore((s) => s.activeId)
  const tasks = useStore((s) => s.tasks)
  const idea = useStore((s) => s.idea)
  const draft = useStore((s) => s.draft)
  const setDraft = useStore((s) => s.setDraft)
  const addTask = useStore((s) => s.addTask)
  const toggleRun = useStore((s) => s.toggleRun)
  const resetTimer = useStore((s) => s.resetTimer)
  const skip = useStore((s) => s.skip)
  const nextIdea = useStore((s) => s.nextIdea)
  const focusMinutes = useStore((s) => s.settings.focusMinutes)
  const breakMinutes = useStore((s) => s.settings.breakMinutes)

  const isMobile = useMediaQuery(BP_MOBILE)
  const isNarrow = useMediaQuery(BP_NARROW)
  const ringSize = isNarrow ? 210 : isMobile ? 270 : 340
  const ringInset = isNarrow ? 10 : isMobile ? 12 : 14
  const clockSize = isNarrow ? 46 : isMobile ? 58 : 74

  const t0 = iso(new Date())
  const sessions = useStore((s) => s.sessions)
  const sessionsToday = sessions.filter((s) => iso(new Date(s.startedAt)) === t0)

  const total = (mode === 'focus' ? focusMinutes : breakMinutes) * 60
  const pct = Math.max(0, Math.min(1, 1 - remaining / total))
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const active = tasks.find((t) => t.id === activeId && !t.done)
  const todayOpen = tasks.filter((t) => !t.done && t.due <= t0).slice(0, 6)
  const onBreak = mode === 'break'

  const runLabel = running ? 'Pause' : remaining === total ? (mode === 'focus' ? 'Start focus' : 'Start break') : 'Resume'

  const pipCount = Math.max(6, sessionsToday.length)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minWidth: 0 }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isNarrow ? 22 : isMobile ? 28 : 34,
          padding: isNarrow ? '32px 18px' : isMobile ? '40px 24px' : '60px 40px',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--fm)',
            fontSize: 10,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            padding: '6px 13px',
            borderRadius: 99,
            color: mode === 'focus' ? 'var(--accent)' : 'var(--ok)',
            border: `1px solid ${(mode === 'focus' ? theme.accent : theme.ok)}55`,
            background: 'var(--panel)',
          }}
        >
          {mode === 'focus' ? 'Focus' : 'Break'}
        </div>

        <div style={{ position: 'relative', width: ringSize, height: ringSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `conic-gradient(${mode === 'focus' ? 'var(--accent)' : 'var(--ok)'} ${pct * 360}deg, var(--line) 0deg)`,
              opacity: running ? 1 : 0.72,
              transition: 'opacity .3s',
            }}
          />
          <div style={{ position: 'absolute', inset: ringInset, borderRadius: '50%', background: 'var(--bg)' }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: clockSize, lineHeight: 1, letterSpacing: '-.03em', color: 'var(--fgs)' }}>
              {pad(mm)}:{pad(ss)}
            </div>
            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: 10,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'var(--faint)',
              }}
            >
              SESSION {sessionsToday.length + 1}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            minHeight: 52,
            textAlign: 'center',
            maxWidth: 420,
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
            {mode === 'focus' ? 'Working on' : 'Up next'}
          </div>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 22, lineHeight: 1.3, color: 'var(--fg)' }}>
            {active ? active.title : 'Nothing picked — choose a task on the right.'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={toggleRun}
            className="btn-primary"
            style={{
              padding: '13px 30px',
              border: 0,
              borderRadius: 'var(--r)',
              fontSize: 14.5,
              fontWeight: 600,
              fontFamily: 'inherit',
              background: mode === 'focus' ? 'var(--accent)' : 'var(--ok)',
              color: 'var(--ink)',
            }}
          >
            {runLabel}
          </button>
          <button
            onClick={resetTimer}
            className="btn-outline"
            style={{
              padding: '13px 18px',
              border: '1px solid var(--line2)',
              borderRadius: 'var(--r)',
              background: 'transparent',
              color: 'var(--dim)',
              fontSize: 14,
            }}
          >
            Reset
          </button>
          <button
            onClick={() => skip()}
            className="btn-text"
            style={{
              padding: '13px 18px',
              border: '1px solid transparent',
              borderRadius: 'var(--r)',
              background: 'transparent',
              color: 'var(--faint)',
              fontSize: 14,
            }}
          >
            {mode === 'focus' ? 'Skip to break' : 'Back to focus'}
          </button>
        </div>

        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: 26,
              fontFamily: 'var(--fm)',
              fontSize: 10,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--faint2)',
            }}
          >
            space to start / pause
          </div>
        )}
      </div>

      <div
        style={
          isMobile
            ? {
                width: '100%',
                flex: 'none',
                borderTop: '1px solid var(--line)',
                padding: isNarrow ? '20px 18px' : '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }
            : {
                width: 312,
                flex: 'none',
                borderLeft: '1px solid var(--line)',
                padding: '26px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                height: '100vh',
                position: 'sticky',
                top: 0,
                overflowY: 'auto',
              }
        }
      >
        {onBreak && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: 16,
              border: '1px solid var(--line2)',
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
                color: 'var(--accent)',
              }}
            >
              Break idea
            </div>
            <div style={{ fontFamily: 'var(--fd)', fontSize: 17, lineHeight: 1.4, color: 'var(--fg)' }}>
              {BREAK_IDEAS[idea % BREAK_IDEAS.length]}
            </div>
            <button
              onClick={nextIdea}
              className="btn-text"
              style={{ alignSelf: 'flex-start', padding: 0, border: 0, background: 'transparent', color: 'var(--dim2)', fontSize: 12 }}
            >
              Another →
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div
            style={{
              fontFamily: 'var(--fm)',
              fontSize: 9,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
            }}
          >
            Queue
          </div>
          <div style={{ fontSize: 12, color: 'var(--faint)' }}>Pick what this session is for.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {todayOpen.map((t) => (
            <TaskRow key={t.id} task={t} compact />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 12px',
            border: '1px dashed var(--line2)',
            borderRadius: 'var(--r)',
          }}
        >
          <span style={{ color: 'var(--faint)', fontSize: 15, lineHeight: 1 }}>+</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask(draft)
            }}
            placeholder="Add a task…"
            style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', fontSize: 13.5, color: 'var(--fg)' }}
          />
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 18,
            borderTop: '1px solid var(--line)',
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
            Sessions today
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: pipCount }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 22,
                  height: 5,
                  borderRadius: 5,
                  background: i < sessionsToday.length ? 'var(--accent)' : 'var(--line)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
