import { useEffect, useMemo } from 'react'
import { Sidebar } from './components/Sidebar'
import { BP_MOBILE, useMediaQuery } from './hooks/useMediaQuery'
import { getThemeBackgroundStyle } from './lib/bgArt'
import { applyTheme, THEMES } from './lib/themes'
import { useStore } from './store/useStore'
import { AssetsView } from './views/AssetsView'
import { CalendarView } from './views/CalendarView'
import { FocusView } from './views/FocusView'
import { ListsView } from './views/ListsView'
import { PeopleView } from './views/PeopleView'
import { PlacesView } from './views/PlacesView'
import { PortfolioEditorView } from './views/PortfolioEditorView'
import { ProgressView } from './views/ProgressView'
import { SettingsView } from './views/SettingsView'
import { ThingsView } from './views/ThingsView'
import { TodayView } from './views/TodayView'

export default function App() {
  const loaded = useStore((s) => s.loaded)
  const view = useStore((s) => s.view)
  const theme = useStore((s) => s.theme)
  const init = useStore((s) => s.init)
  const isMobile = useMediaQuery(BP_MOBILE)
  const bgStyle = useMemo(() => getThemeBackgroundStyle(THEMES[theme]), [theme])

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    applyTheme(THEMES[theme])
  }, [theme])

  useEffect(() => {
    const id = setInterval(() => useStore.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [])

  // Reminder polling is deliberately a separate, coarser interval from the
  // 1s timer tick above — that one is timer-critical, this only needs
  // minute-level precision and shouldn't run 60x more often than needed.
  useEffect(() => {
    useStore.getState().checkReminders()
    const id = setInterval(() => useStore.getState().checkReminders(), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    // Background tabs can have their timers throttled or paused entirely
    // (virtual-desktop switches, tab discarding). Re-sync against the
    // wall-clock end time the moment the tab is visible again, rather than
    // waiting for the next (possibly delayed) interval tick.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') useStore.getState().tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || useStore.getState().view !== 'focus') return
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      e.preventDefault()
      useStore.getState().toggleRun()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!loaded) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)' }}>
        Loading…
      </div>
    )
  }

  return (
    <>
      {/* Decorative theme art lives on its own fixed layer, never as the
          background of a container that also holds real content — CSS
          `mask-image` masks an element's children too, not just its own
          background paint, so sharing a node with the UI would make parts
          of the app fade to invisible. */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, ...bgStyle }} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: '100vh',
          color: 'var(--fg)',
        }}
      >
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {view === 'focus' && <FocusView />}
          {view === 'today' && <TodayView />}
          {view === 'calendar' && <CalendarView />}
          {view === 'stats' && <ProgressView />}
          {view === 'people' && <PeopleView />}
          {view === 'things' && <ThingsView />}
          {view === 'places' && <PlacesView />}
          {view === 'lists' && <ListsView />}
          {view === 'assets' && <AssetsView />}
          {view === 'portfolio' && <PortfolioEditorView />}
          {view === 'settings' && <SettingsView />}
        </main>
      </div>
    </>
  )
}
