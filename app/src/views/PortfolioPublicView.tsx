import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { buildSessionHistory, computeKpis, computeStreak } from '../lib/derived'
import { applyTheme, THEMES } from '../lib/themes'
import type { PublicPortfolio } from '../types'

interface PortfolioPublicViewProps {
  token: string
}

export function PortfolioPublicView({ token }: PortfolioPublicViewProps) {
  const [data, setData] = useState<PublicPortfolio | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    applyTheme(THEMES.night)
  }, [])

  useEffect(() => {
    api
      .getPublicPortfolio(token)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
  }, [token])

  if (notFound) {
    return (
      <Shell>
        <div style={{ color: 'var(--faint)', fontSize: 14 }}>This portfolio link doesn't exist or is no longer shared.</div>
      </Shell>
    )
  }

  if (!data) return null

  const history = buildSessionHistory(data.sessions)
  const today = new Date()
  const kpis = computeKpis(history, today)
  const streak = computeStreak(history, today)

  return (
    <Shell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: 34, fontWeight: 400, color: 'var(--fgs)' }}>
          {data.displayName || 'Untitled'}
        </h1>
        {data.headline && <div style={{ fontSize: 15, color: 'var(--dim)' }}>{data.headline}</div>}
      </div>

      {data.bio && <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg)', maxWidth: 560 }}>{data.bio}</div>}

      {data.links.length > 0 && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {data.links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 13 }}>
              {l.label}
            </a>
          ))}
        </div>
      )}

      {data.projects.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>Projects</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.projects.map((p, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 15, color: 'var(--fgs)' }}>
                    {p.title}
                  </a>
                ) : (
                  <div style={{ fontSize: 15, color: 'var(--fgs)' }}>{p.title}</div>
                )}
                {p.description && <div style={{ fontSize: 13, color: 'var(--dim2)' }}>{p.description}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionLabel>Focus record</SectionLabel>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <Stat value={`${kpis.yearHours}h`} label="logged this year" />
          <Stat value={`${streak}d`} label="current streak" />
          <Stat value={`${kpis.activeDays}`} label="active days" />
        </div>
      </section>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 640, padding: '64px 28px', display: 'flex', flexDirection: 'column', gap: 30 }}>{children}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: 'var(--fm)', fontSize: 24, color: 'var(--fgs)' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{label}</div>
    </div>
  )
}
