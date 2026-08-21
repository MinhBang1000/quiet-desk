import { useHistory } from '../hooks/useHistory'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { DOW } from '../lib/date'
import { computeMonthGrid } from '../lib/derived'
import { heatColor, tagColor, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'

export function CalendarView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const isNarrow = useMediaQuery(BP_NARROW)
  const tasks = useStore((s) => s.tasks)
  const tags = useStore((s) => s.tags)
  const monthOffset = useStore((s) => s.monthOffset)
  const prevMonth = useStore((s) => s.prevMonth)
  const nextMonth = useStore((s) => s.nextMonth)
  const thisMonth = useStore((s) => s.thisMonth)
  const pickDateForNewTask = useStore((s) => s.pickDateForNewTask)
  const theme = useStore((s) => THEMES[s.theme])
  const history = useHistory()

  const today = new Date()
  const { cells, label, monthMinutes } = computeMonthGrid(tasks, history, monthOffset, today)

  const legendStops = [0, 30, 60, 110, 170]
  const dayNames = isNarrow ? DOW.map((d) => d[0]) : DOW

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: isNarrow ? '20px 16px' : isMobile ? '28px 24px' : '44px 52px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 16 : 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          alignItems: isNarrow ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: isNarrow ? 12 : 20,
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
            Month
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--fd)',
              fontSize: isNarrow ? 26 : isMobile ? 32 : 38,
              fontWeight: 400,
              letterSpacing: '-.015em',
              color: 'var(--fgs)',
            }}
          >
            {label}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={prevMonth}
            className="icon-btn"
            style={{
              width: 34,
              height: 34,
              border: '1px solid var(--line2)',
              borderRadius: 'calc(var(--r) - 1px)',
              background: 'transparent',
              color: 'var(--dim)',
            }}
          >
            ←
          </button>
          <button
            onClick={thisMonth}
            className="icon-btn"
            style={{
              padding: '0 14px',
              height: 34,
              border: '1px solid var(--line2)',
              borderRadius: 'calc(var(--r) - 1px)',
              background: 'transparent',
              color: 'var(--dim)',
              fontSize: 13,
            }}
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="icon-btn"
            style={{
              width: 34,
              height: 34,
              border: '1px solid var(--line2)',
              borderRadius: 'calc(var(--r) - 1px)',
              background: 'transparent',
              color: 'var(--dim)',
            }}
          >
            →
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isNarrow ? 3 : 6 }}>
        {dayNames.map((d, i) => (
          <div
            key={DOW[i]}
            style={{
              fontFamily: 'var(--fm)',
              fontSize: isNarrow ? 9 : 9.5,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--faint2)',
              padding: isNarrow ? '0 2px 4px' : '0 4px 4px',
            }}
          >
            {d}
          </div>
        ))}
        {cells.map((c) => (
          <button
            key={c.key}
            onClick={() => c.inMonth && pickDateForNewTask(c.dateKey)}
            className={c.inMonth ? 'day-cell' : undefined}
            style={{
              position: 'relative',
              minHeight: isNarrow ? 56 : isMobile ? 76 : 104,
              padding: isNarrow ? '5px 5px 8px' : isMobile ? '7px 8px 10px' : '9px 10px 12px',
              textAlign: 'left',
              cursor: c.inMonth ? 'pointer' : 'default',
              borderRadius: 'var(--r)',
              border: `1px solid ${c.isToday ? theme.accent + '88' : 'var(--line)'}`,
              background: c.inMonth ? (c.isToday ? 'var(--hover)' : 'var(--panel)') : 'transparent',
              color: c.inMonth ? (c.isToday ? 'var(--fgs)' : 'var(--dim)') : 'var(--line2)',
              overflow: 'hidden',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ fontFamily: 'var(--fm)', fontSize: isNarrow ? 11 : 13 }}>{c.dayNum}</span>
              {!isNarrow && (
                <span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, color: 'var(--faint)' }}>
                  {c.inMonth && c.minutes ? `${c.minutes}m` : ''}
                </span>
              )}
            </div>
            {!isNarrow && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                {c.items.slice(0, isMobile ? 1 : 3).map((i) => (
                  <div
                    key={i.id}
                    style={{
                      fontSize: 10.5,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: i.done ? 'var(--faint)' : 'var(--dim)',
                      borderLeft: `2px solid ${tagColor(theme, i.tag, tags)}`,
                      paddingLeft: 5,
                      textDecoration: i.done ? 'line-through' : 'none',
                    }}
                  >
                    {i.title}
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 3,
                background: c.inMonth ? heatColor(theme, c.minutes) : 'transparent',
              }}
            />
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingTop: 6, flexWrap: 'wrap', rowGap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--fm)',
            fontSize: 9.5,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'var(--faint2)',
          }}
        >
          Focus depth
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {legendStops.map((m) => (
            <span key={m} style={{ width: 10, height: 10, borderRadius: 2, background: heatColor(theme, m) }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--faint)' }}>{Math.round(monthMinutes / 60)} hours focused this month</span>
      </div>
    </div>
  )
}
