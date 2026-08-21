import { TaskRow } from '../components/TaskRow'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { DOW, iso, MONTH_NAMES } from '../lib/date'
import { useStore } from '../store/useStore'

export function TodayView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const isNarrow = useMediaQuery(BP_NARROW)
  const tasks = useStore((s) => s.tasks)
  const draft = useStore((s) => s.draft)
  const setDraft = useStore((s) => s.setDraft)
  const dueDraft = useStore((s) => s.dueDraft)
  const setDueDraft = useStore((s) => s.setDueDraft)
  const addTask = useStore((s) => s.addTask)

  const today = new Date()
  const t0 = iso(today)
  const todayMinutes = useStore((s) =>
    s.sessions.filter((sess) => iso(new Date(sess.startedAt)) === t0).reduce((sum, sess) => sum + sess.minutes, 0)
  )

  const dueToday = tasks.filter((t) => t.due === t0)
  const doneToday = dueToday.filter((t) => t.done)

  const open = tasks.filter((t) => !t.done)
  const now = open.filter((t) => t.due <= t0)
  const comingUp = open.filter((t) => t.due > t0)
  const done = tasks.filter((t) => t.done)

  const groups = [
    { key: 'now', label: 'Now', items: now },
    { key: 'soon', label: 'Coming up', items: comingUp },
    { key: 'done', label: 'Done', items: done },
  ].filter((g) => g.items.length)

  const todayStamp = `${DOW[(today.getDay() + 6) % 7].toUpperCase()} · ${MONTH_NAMES[today.getMonth()].slice(0, 3).toUpperCase()} ${today.getDate()}`

  return (
    <div style={{ flex: 1, minWidth: 0, padding: isNarrow ? '24px 18px' : isMobile ? '32px 28px' : '44px 52px', maxWidth: 920 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: isMobile ? 10 : 20,
          paddingBottom: 22,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontFamily: 'var(--fm)',
              fontSize: 10,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
            }}
          >
            {todayStamp}
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--fd)',
              fontSize: isNarrow ? 28 : 38,
              fontWeight: 400,
              letterSpacing: '-.015em',
              color: 'var(--fgs)',
            }}
          >
            Today
          </h1>
        </div>
        <div style={{ fontSize: 13, color: 'var(--dim2)', textAlign: isMobile ? 'left' : 'right', lineHeight: 1.6 }}>
          {todayMinutes} min focused today · {doneToday.length} of {Math.max(1, dueToday.length)} planned done
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          margin: '22px 0 26px',
          padding: '13px 14px',
          border: '1px solid var(--line)',
          borderRadius: 'calc(var(--r) + 1px)',
          background: 'var(--panel)',
          flexWrap: isNarrow ? 'wrap' : 'nowrap',
        }}
      >
        <span style={{ color: 'var(--accent)', fontSize: 16, lineHeight: 1 }}>+</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTask(draft, dueDraft)
          }}
          placeholder="What needs doing? Type #study or #writing to tag it."
          style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', fontSize: 14.5, color: 'var(--fg)' }}
        />
        <input
          type="date"
          value={dueDraft}
          onChange={(e) => setDueDraft(e.target.value)}
          style={{
            flex: 'none',
            border: '1px solid var(--line2)',
            borderRadius: 'calc(var(--r) - 2px)',
            background: 'transparent',
            padding: '6px 8px',
            fontSize: 12.5,
            color: 'var(--dim)',
            fontFamily: 'var(--fm)',
          }}
        />
        <button
          onClick={() => addTask(draft, dueDraft)}
          className="btn-primary"
          style={{
            padding: '8px 14px',
            border: 0,
            borderRadius: 'calc(var(--r) - 2px)',
            background: 'var(--accent)',
            color: 'var(--ink)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {groups.map((g) => (
          <section key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: 9.5,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'var(--faint)',
                }}
              >
                {g.label}
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--faint2)' }}>{g.items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {g.items.map((t) => (
                <TaskRow key={t.id} task={t} showFocusButton showRemove />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
