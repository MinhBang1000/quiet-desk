import { useEffect, useRef, useState } from 'react'
import { AvatarCropModal } from '../components/AvatarCropModal'
import { ThemePicker } from '../components/ThemePicker'
import { useHistory } from '../hooks/useHistory'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { copyToClipboard } from '../lib/clipboard'
import { computeKpis, computeStreak } from '../lib/derived'
import { fileToResizedDataUrl, initialsAvatar } from '../lib/image'
import { THEMES, type ThemeId } from '../lib/themes'
import { useStore } from '../store/useStore'
import type { Portfolio, PortfolioEntry, PortfolioLink, PortfolioSection } from '../types'

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
  padding: '10px 12px',
  fontSize: 14.5,
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

function IconButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ flex: 'none', padding: '4px 7px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}
    >
      {children}
    </button>
  )
}

function AvatarPicker({ avatarUrl, displayName, onChange }: { avatarUrl: string; displayName: string; onChange: (url: string) => void }) {
  const theme = useStore((s) => THEMES[s.theme])
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const src = avatarUrl || initialsAvatar(displayName || 'You', theme.accent, theme.ink)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <button
        onClick={() => fileRef.current?.click()}
        style={{ padding: 0, border: `1px solid var(--line2)`, borderRadius: '50%', background: 'transparent', cursor: 'pointer', flex: 'none' }}
        title="Change photo"
      >
        <img src={src} alt="Avatar" style={{ width: 128, height: 128, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-outline"
          style={{ padding: '8px 14px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 13, alignSelf: 'flex-start' }}
        >
          Upload photo
        </button>
        {avatarUrl && (
          <button onClick={() => onChange('')} className="btn-text" style={{ padding: 0, border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12, alignSelf: 'flex-start' }}>
            Remove — use initials
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) setPendingFile(file)
        }}
      />
      {pendingFile && (
        <AvatarCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={(dataUrl) => {
            onChange(dataUrl)
            setPendingFile(null)
          }}
        />
      )}
    </div>
  )
}

function GalleryEditor({ gallery, onChange }: { gallery: string[]; onChange: (g: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
      {gallery.map((src, i) => (
        <div key={i} style={{ position: 'relative', height: 160, flex: 'none' }}>
          {/* Natural aspect ratio, not force-cropped to a square — avoids the
              same "cut incorrectly" problem the avatar cropper exists to fix. */}
          <img src={src} alt="" style={{ height: '100%', width: 'auto', display: 'block', borderRadius: 'calc(var(--r) - 1px)', border: '1px solid var(--line2)' }} />
          <button
            onClick={() => onChange(gallery.filter((_, j) => j !== i))}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 22,
              height: 22,
              borderRadius: 22,
              border: '1px solid var(--line2)',
              background: 'var(--panel)',
              color: 'var(--faint)',
              fontSize: 13,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          width: 120,
          height: 160,
          flex: 'none',
          border: '1px dashed var(--line2)',
          borderRadius: 'calc(var(--r) - 1px)',
          background: 'transparent',
          color: 'var(--faint)',
          fontSize: 22,
        }}
      >
        +
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          const dataUrls = await Promise.all(files.map((f) => fileToResizedDataUrl(f, 1200, 0.82)))
          onChange([...gallery, ...dataUrls])
        }}
      />
    </div>
  )
}

function LinksEditor({ links, onChange }: { links: PortfolioLink[]; onChange: (l: PortfolioLink[]) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {links.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          <input
            value={row.label}
            onChange={(e) => onChange(links.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
            placeholder="Label"
            style={{ ...inputStyle, flex: '0 0 130px' }}
          />
          <input
            value={row.url}
            onChange={(e) => onChange(links.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))}
            placeholder="https:// or mailto: or tel:"
            style={inputStyle}
          />
          <IconButton onClick={() => onChange(links.filter((_, j) => j !== i))} title="Remove link">
            ×
          </IconButton>
        </div>
      ))}
      <button
        onClick={() => onChange([...links, { label: '', url: '' }])}
        className="btn-text"
        style={{ alignSelf: 'flex-start', padding: '7px 0', border: 0, background: 'transparent', color: 'var(--dim2)', fontSize: 12.5 }}
      >
        + Add link
      </button>
    </div>
  )
}

const emptyEntry: PortfolioEntry = { heading: '', subheading: '', meta: '', bullets: [], url: '' }

function EntryEditor({ entry, onChange, onRemove }: { entry: PortfolioEntry; onChange: (e: PortfolioEntry) => void; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: 12, border: '1px solid var(--line)', borderRadius: 'calc(var(--r) - 1px)' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={entry.heading} onChange={(e) => onChange({ ...entry, heading: e.target.value })} placeholder="Heading (e.g. institution, employer, project)" style={inputStyle} />
        <IconButton onClick={onRemove} title="Remove entry">
          ×
        </IconButton>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={entry.subheading ?? ''}
          onChange={(e) => onChange({ ...entry, subheading: e.target.value })}
          placeholder="Subheading (role / degree)"
          style={{ ...inputStyle, flex: '1 1 200px' }}
        />
        <input
          value={entry.meta ?? ''}
          onChange={(e) => onChange({ ...entry, meta: e.target.value })}
          placeholder="Dates / location"
          style={{ ...inputStyle, flex: '1 1 160px' }}
        />
      </div>
      <textarea
        value={entry.bullets.join('\n')}
        onChange={(e) => onChange({ ...entry, bullets: e.target.value.split('\n') })}
        placeholder="Detail bullets, one per line"
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
      />
      <input
        value={entry.url ?? ''}
        onChange={(e) => onChange({ ...entry, url: e.target.value })}
        placeholder="Link (optional)"
        style={inputStyle}
      />
    </div>
  )
}

function SectionEditor({
  section,
  onChange,
  onRemove,
  onMove,
}: {
  section: PortfolioSection
  onChange: (s: PortfolioSection) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) + 1px)', background: 'var(--panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Section title"
          style={{ ...inputStyle, fontWeight: 600, flex: 1 }}
        />
        <IconButton onClick={() => onMove(-1)} title="Move up">
          ↑
        </IconButton>
        <IconButton onClick={() => onMove(1)} title="Move down">
          ↓
        </IconButton>
        <IconButton onClick={onRemove} title="Remove section">
          × Section
        </IconButton>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {section.entries.map((entry, i) => (
          <EntryEditor
            key={i}
            entry={entry}
            onChange={(next) => onChange({ ...section, entries: section.entries.map((e, j) => (j === i ? next : e)) })}
            onRemove={() => onChange({ ...section, entries: section.entries.filter((_, j) => j !== i) })}
          />
        ))}
      </div>
      <button
        onClick={() => onChange({ ...section, entries: [...section.entries, { ...emptyEntry, bullets: [] }] })}
        className="btn-text"
        style={{ alignSelf: 'flex-start', padding: '4px 0', border: 0, background: 'transparent', color: 'var(--dim2)', fontSize: 12.5 }}
      >
        + Add entry
      </button>
    </div>
  )
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2400)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 28,
        transform: 'translateX(-50%)',
        zIndex: 200,
        padding: '11px 18px',
        borderRadius: 'var(--r)',
        border: '1px solid var(--line2)',
        background: 'var(--panel)',
        color: 'var(--fgs)',
        fontSize: 13,
        boxShadow: '0 12px 32px rgba(0,0,0,.35)',
      }}
    >
      {message}
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
  const [avatarUrl, setAvatarUrl] = useState(portfolio.avatarUrl)
  const [gallery, setGallery] = useState<string[]>(portfolio.gallery)
  const [links, setLinks] = useState<PortfolioLink[]>(portfolio.links)
  const [sections, setSections] = useState<PortfolioSection[]>(portfolio.sections)
  const [theme, setTheme] = useState<ThemeId>((portfolio.theme as ThemeId) in THEMES ? (portfolio.theme as ThemeId) : 'night')
  const [shareEnabled, setShareEnabled] = useState(portfolio.shareEnabled)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const publicUrl = `${window.location.origin}/p/${portfolio.shareToken}`

  const save = () => {
    updatePortfolio({ displayName, headline, bio, avatarUrl, gallery, links, sections, theme, shareEnabled })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const copyLink = async () => {
    const ok = await copyToClipboard(publicUrl)
    setToast(ok ? 'Link copied to clipboard' : 'Could not copy automatically — select the link and copy it manually')
  }

  const regenerate = () => {
    if (window.confirm('Regenerate the public link? The old link will stop working immediately.')) {
      rotateShareToken()
    }
  }

  const addSection = () => {
    setSections([
      ...sections,
      { id: crypto.randomUUID(), title: 'New section', entries: [{ ...emptyEntry, bullets: [] }] },
    ])
  }

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...sections]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSections(next)
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
        maxWidth: 780,
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
        <AvatarPicker avatarUrl={avatarUrl} displayName={displayName} onChange={setAvatarUrl} />
        <Field label="Display name">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Headline">
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} style={inputStyle} placeholder="Ph.D. Student, EECS, NYCU" />
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
        {sectionHeader('Gallery')}
        <div style={{ fontSize: 12.5, color: 'var(--dim2)' }}>A few pictures of you — at work, at a conference, wherever. Shown on the public page.</div>
        <GalleryEditor gallery={gallery} onChange={setGallery} />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Contact links')}
        <LinksEditor links={links} onChange={setLinks} />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Sections')}
        <div style={{ fontSize: 12.5, color: 'var(--dim2)' }}>
          Freeform blocks — Education, Experience, Publications, Awards, whatever fits. Add as many as you like, in any order.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sections.map((section, i) => (
            <SectionEditor
              key={section.id}
              section={section}
              onChange={(next) => setSections(sections.map((s, j) => (j === i ? next : s)))}
              onRemove={() => setSections(sections.filter((_, j) => j !== i))}
              onMove={(dir) => moveSection(i, dir)}
            />
          ))}
        </div>
        <button
          onClick={addSection}
          className="btn-outline"
          style={{ alignSelf: 'flex-start', padding: '8px 14px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}
        >
          + Add section
        </button>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Theme')}
        <div style={{ fontSize: 12.5, color: 'var(--dim2)' }}>
          The look of your public page — independent from the app's own theme, which stays whatever you like while you edit.
        </div>
        <div style={{ maxWidth: 280 }}>
          <ThemePicker value={theme} onChange={setTheme} openDirection="down" />
        </div>
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
            Copy link
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

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
