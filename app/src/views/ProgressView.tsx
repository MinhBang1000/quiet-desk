import { useHistory } from '../hooks/useHistory'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { computeHeatCols53, computeKpis, computeLast14, computeRows7, computeTagRows30 } from '../lib/derived'
import { heatColor, tagColor, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'

export function ProgressView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const isNarrow = useMediaQuery(BP_NARROW)
  const theme = useStore((s) => THEMES[s.theme])
  const tags = useStore((s) => s.tags)
  const goalMinutes = useStore((s) => s.settings.goalMinutes)
  const history = useHistory()
  const today = new Date()

  const kpis = computeKpis(history, today)
  const { bars, max } = computeLast14(history, today)
  const rows7 = computeRows7(history, today)
  const tagRows = computeTagRows30(history, today, tags)
  const { cols: heatCols, yearMinutes } = computeHeatCols53(history, today)

  const kpiItems = [
    { label: 'Focus this year', value: `${kpis.yearHours}h`, note: `${kpis.activeDays} days at the desk` },
    { label: 'Daily average', value: `${kpis.dailyAverage}m`, note: 'across all 365 days' },
    { label: 'Current streak', value: `${kpis.streak}d`, note: 'days with 25+ minutes' },
    { label: 'Best day', value: `${kpis.bestDayMinutes}m`, note: 'personal record' },
  ]

  const sectionHeader = (label: string, right?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      {right && <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--faint2)' }}>{right}</span>}
    </div>
  )

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: isNarrow ? '24px 18px' : isMobile ? '32px 28px' : '44px 52px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 26 : 34,
        maxWidth: 1080,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          Last 12 months
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--fd)',
            fontSize: isNarrow ? 28 : isMobile ? 32 : 38,
            fontWeight: 400,
            letterSpacing: '-.015em',
            color: 'var(--fgs)',
          }}
        >
          Progress
        </h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 1,
          background: 'var(--line)',
          border: '1px solid var(--line)',
          borderRadius: 'calc(var(--r) + 1px)',
          overflow: 'hidden',
        }}
      >
        {kpiItems.map((k) => (
          <div key={k.label} style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '18px 20px', background: 'var(--panel)' }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              {k.label}
            </div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 27, color: 'var(--fgs)', letterSpacing: '-.02em' }}>{k.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{k.note}</div>
          </div>
        ))}
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sectionHeader('Focus minutes · 14 days')}
        <div style={{ overflowX: isMobile ? 'auto' : 'visible' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              height: 150,
              paddingBottom: 22,
              borderBottom: '1px solid var(--line)',
              minWidth: isMobile ? 560 : 'auto',
            }}
          >
            {bars.map((b) => (
              <div
                key={b.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 8,
                  height: '100%',
                  position: 'relative',
                }}
              >
              <span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, color: 'var(--faint)' }}>{b.minutes || ''}</span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 34,
                  height: `${Math.max(2, (b.minutes / max) * 100)}%`,
                  borderRadius: 4,
                  background: b.isToday ? theme.accent : b.minutes >= goalMinutes ? theme.accent + 'CC' : theme.accent + '66',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: -20,
                  fontFamily: 'var(--fm)',
                  fontSize: 9,
                  letterSpacing: '.06em',
                  color: 'var(--faint2)',
                }}
              >
                {b.label}
              </span>
            </div>
          ))}
          </div>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.15fr 1fr',
          gap: isMobile ? 26 : 34,
        }}
      >
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sectionHeader('Done vs planned · 7 days')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {rows7.map((r) => (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 34, flex: 'none', fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.06em', color: 'var(--faint)' }}>
                  {r.label}
                </span>
                <div style={{ flex: 1, height: 16, background: 'var(--track)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'var(--line)', borderRadius: 4 }} />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${r.pct}%`,
                      background: r.metGoal ? 'var(--ok)' : 'var(--accent)',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ width: 52, flex: 'none', textAlign: 'right', fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--dim2)' }}>
                  {r.done}/{r.planned}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sectionHeader('Where the hours went · 30 days')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {tagRows.map((t) => (
              <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 7, background: tagColor(theme, t.name, tags) }} />
                    <span style={{ fontSize: 13, color: 'var(--fg)' }}>{t.name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: 10.5, color: 'var(--dim2)' }}>
                    {Math.round(t.minutes / 60)}h · {t.pct}%
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--track)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.pct}%`, background: tagColor(theme, t.name, tags), borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sectionHeader('The year in focus', `${Math.round(yearMinutes / 60)}h total`)}
        <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 6 }}>
          {heatCols.map((col, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {col.map((cell) => (
                <span
                  key={cell.key}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: cell.minutes < 0 ? 'transparent' : heatColor(theme, cell.minutes),
                    outline: cell.isToday ? '1px solid var(--fg)' : 'none',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
