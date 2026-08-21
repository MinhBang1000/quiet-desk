import { useState } from 'react'
import { useHistory } from '../hooks/useHistory'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { computeKpis, computeStreak } from '../lib/derived'
import { useStore } from '../store/useStore'
import type { Portfolio, PortfolioLink, PortfolioProject } from '../types'

function sectionHeader(label: string) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

const inputStyle = {
  width: '100%',
  border: '1px solid var(--line2)',
  borderRadius: 'calc(var(--r) - 2px)',
  background: 'var(--bg)',
  padding: '9px 11px',
  fontSize: 13.5,
  color: 'var(--fg)',
  fontFamily: 'inherit',
} as const

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11.5, color: 'var(--dim2)' }}>{label}</span>
      {children}
    </label>
  )
}

function RowEditor<T>({
  rows,
  onChange,
  empty,
  renderRow,
  addLabel,
}: {
  rows: T[]
  onChange: (rows: T[]) => void
  empty: T
  renderRow: (row: T, update: (patch: Partial<T>) => void) => React.ReactNode
  addLabel: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {renderRow(row, (patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))))}
          </div>
          <button
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            style={{ flex: 'none', padding: '6px 8px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...rows, empty])}
        className="btn-text"
        style={{
          alignSelf: 'flex-start',
          padding: '7px 0',
          border: 0,
          background: 'transparent',
          color: 'var(--dim2)',
          fontSize: 12.5,
        }}
      >
        {addLabel}
      </button>
    </div>
  )
}

export function PortfolioEditorView() {
  const portfolio = useStore((s) => s.portfolio)
  if (!portfolio) return null
  return <PortfolioForm portfolio={portfolio} />
}

function PortfolioForm({ portfolio }: { portfolio: Portfolio }) {
  const isMobile = useMediaQuery(BP_MOBILE)
  const isNarrow = useMediaQuery(BP_NARROW)
  const updatePortfolio = useStore((s) => s.updatePortfolio)
  const rotateShareToken = useStore((s) => s.rotateShareToken)
  const history = useHistory()
  const today = new Date()
  const kpis = computeKpis(history, today)
  const streak = computeStreak(history, today)

  const [displayName, setDisplayName] = useState(portfolio.displayName)
  const [headline, setHeadline] = useState(portfolio.headline)
  const [bio, setBio] = useState(portfolio.bio)
  const [links, setLinks] = useState<PortfolioLink[]>(portfolio.links)
  const [projects, setProjects] = useState<PortfolioProject[]>(portfolio.projects)
  const [shareEnabled, setShareEnabled] = useState(portfolio.shareEnabled)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const publicUrl = `${window.location.origin}/p/${portfolio.shareToken}`

  const save = () => {
    updatePortfolio({ displayName, headline, bio, links, projects, shareEnabled })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const regenerate = () => {
    if (window.confirm('Regenerate the public link? The old link will stop working immediately.')) {
      rotateShareToken()
    }
  }

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: isNarrow ? '24px 18px' : isMobile ? '32px 28px' : '44px 52px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 26 : 34,
        maxWidth: 760,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          Editable · shareable
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: isNarrow ? 28 : isMobile ? 32 : 38, fontWeight: 400, letterSpacing: '-.015em', color: 'var(--fgs)' }}>
          Portfolio
        </h1>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Profile')}
        <Field label="Display name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Headline">
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} style={inputStyle} placeholder="Product-minded engineer" />
        </Field>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </Field>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Links')}
        <RowEditor
          rows={links}
          onChange={setLinks}
          empty={{ label: '', url: '' }}
          addLabel="+ Add link"
          renderRow={(row, update) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={row.label} onChange={(e) => update({ label: e.target.value })} placeholder="Label" style={{ ...inputStyle, flex: '0 0 130px' }} />
              <input value={row.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://…" style={inputStyle} />
            </div>
          )}
        />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Projects')}
        <RowEditor
          rows={projects}
          onChange={setProjects}
          empty={{ title: '', description: '', url: '' }}
          addLabel="+ Add project"
          renderRow={(row, update) => (
            <>
              <input value={row.title} onChange={(e) => update({ title: e.target.value })} placeholder="Title" style={inputStyle} />
              <input value={row.description} onChange={(e) => update({ description: e.target.value })} placeholder="One-line description" style={inputStyle} />
              <input value={row.url} onChange={(e) => update({ url: e.target.value })} placeholder="https:// (optional)" style={inputStyle} />
            </>
          )}
        />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Focus record preview')}
        <div style={{ fontSize: 12.5, color: 'var(--dim2)' }}>What visitors will see, computed live from your session log.</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 13, color: 'var(--fgs)' }}>{kpis.yearHours}h logged</div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 13, color: 'var(--fgs)' }}>{streak}d streak</div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 13, color: 'var(--fgs)' }}>{kpis.activeDays} active days</div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Sharing')}
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--fg)' }}>
          <input type="checkbox" checked={shareEnabled} onChange={(e) => setShareEnabled(e.target.checked)} />
          Make my portfolio public at this link
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input readOnly value={publicUrl} style={{ ...inputStyle, flex: 1, minWidth: 200, color: 'var(--dim)' }} />
          <button
            onClick={copyLink}
            className="btn-outline"
            style={{ flex: 'none', padding: '9px 14px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button
            onClick={regenerate}
            className="btn-text"
            style={{ flex: 'none', padding: '9px 6px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12.5 }}
          >
            Regenerate
          </button>
        </div>
      </section>

      <div>
        <button
          onClick={save}
          className="btn-primary"
          style={{ padding: '12px 24px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
