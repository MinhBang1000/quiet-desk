import { CategoryManager } from '../components/CategoryManager'
import { CollectionManager } from '../components/CollectionManager'
import { CurrencyRatesPanel } from '../components/CurrencyRatesPanel'
import { RemindersToggle } from '../components/RemindersToggle'
import { TagManager } from '../components/TagManager'
import { ThemePicker } from '../components/ThemePicker'
import { TimerSettings } from '../components/TimerSettings'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { sectionHeader } from '../lib/formKit'

export function SettingsView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const isNarrow = useMediaQuery(BP_NARROW)

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: isNarrow ? '24px 18px' : isMobile ? '32px 28px' : '44px 52px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 26 : 34,
        maxWidth: 560,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
          Personal
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: isNarrow ? 28 : 38, fontWeight: 400, letterSpacing: '-.015em', color: 'var(--fgs)' }}>
          Settings
        </h1>
      </div>

      {/* TimerSettings/TagManager/CategoryManager already render as
          self-labeled bordered panels, so they don't get a duplicate
          outer section header — Reminders and Appearance do, since those
          two are plain controls without their own panel chrome. */}
      <TimerSettings />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Reminders')}
        <RemindersToggle />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sectionHeader('Appearance')}
        <div style={{ maxWidth: 280 }}>
          <ThemePicker openDirection="down" />
        </div>
      </section>

      <TagManager />
      <CategoryManager module="person" label="People categories" />
      <CategoryManager module="thing" label="Thing categories" />
      <CategoryManager module="place" label="Place categories" />
      <CategoryManager module="place_tag" label="Place tags" />
      <CollectionManager />
      <CurrencyRatesPanel />
    </div>
  )
}
