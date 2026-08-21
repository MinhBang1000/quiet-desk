import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { buildSessionHistory, computeKpis, computeStreak } from '../lib/derived'
import { initialsAvatar } from '../lib/image'
import { applyTheme, THEMES, type ThemeId } from '../lib/themes'
import type { PublicPortfolio } from '../types'

function resolveTheme(id: string): ThemeId {
  return id in THEMES ? (id as ThemeId) : 'night'
}

interface PortfolioPublicViewProps {
  token: string
}

export function PortfolioPublicView({ token }: PortfolioPublicViewProps) {
  const [data, setData] = useState<PublicPortfolio | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // Sensible default while the real data (and its chosen theme) loads.
    applyTheme(THEMES.night)
  }, [])

  useEffect(() => {
    if (data) applyTheme(THEMES[resolveTheme(data.theme)])
  }, [data])

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
  const theme = THEMES[resolveTheme(data.theme)]
  const avatarSrc = data.avatarUrl || initialsAvatar(data.displayName || '?', theme.accent, theme.ink)

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <img
          src={avatarSrc}
          alt={data.displayName}
          style={{ width: 148, height: 148, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line2)', flex: 'none' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: 44, fontWeight: 400, color: 'var(--fgs)' }}>
            {data.displayName || 'Untitled'}
          </h1>
          {data.headline && <div style={{ fontSize: 18, color: 'var(--dim)' }}>{data.headline}</div>}
        </div>
      </div>

      {data.bio && <div style={{ fontSize: 16.5, lineHeight: 1.7, color: 'var(--fg)', maxWidth: 640 }}>{data.bio}</div>}

      {data.links.length > 0 && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {data.links
            .filter((l) => l.label && l.url)
            .map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 14.5 }}>
                {l.label}
              </a>
            ))}
        </div>
      )}

      {data.gallery.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {data.gallery.map((src, i) => (
            // Natural aspect ratio, not force-cropped to a square — a fixed
            // height keeps the strip tidy without cutting people's heads off.
            <img
              key={i}
              src={src}
              alt=""
              style={{
                height: 220,
                width: 'auto',
                flex: 'none',
                borderRadius: 'calc(var(--r) - 1px)',
                border: '1px solid var(--line2)',
              }}
            />
          ))}
        </div>
      )}

      {data.sections.map((section) => (
        <section key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionLabel>{section.title}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {section.entries.map((entry, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                  {entry.url ? (
                    <a href={entry.url} target="_blank" rel="noreferrer" style={{ fontSize: 18, color: 'var(--fgs)' }}>
                      {entry.heading}
                    </a>
                  ) : (
                    <div style={{ fontSize: 18, color: 'var(--fgs)' }}>{entry.heading}</div>
                  )}
                  {entry.meta && <div style={{ fontSize: 13, color: 'var(--faint)', fontFamily: 'var(--fm)' }}>{entry.meta}</div>}
                </div>
                {entry.subheading && <div style={{ fontSize: 15.5, color: 'var(--dim)' }}>{entry.subheading}</div>}
                {entry.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '6px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {entry.bullets.filter(Boolean).map((b, bi) => (
                      <li key={bi} style={{ fontSize: 14.5, color: 'var(--dim2)', lineHeight: 1.6 }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SectionLabel>Focus record</SectionLabel>
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
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
      <div style={{ width: '100%', maxWidth: 760, padding: '72px 32px', display: 'flex', flexDirection: 'column', gap: 40 }}>{children}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: 'var(--fm)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontFamily: 'var(--fm)', fontSize: 30, color: 'var(--fgs)' }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--dim2)' }}>{label}</div>
    </div>
  )
}
