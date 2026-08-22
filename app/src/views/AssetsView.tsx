import { useMemo, useState } from 'react'
import { AssetForm } from '../components/AssetForm'
import { BP_MOBILE, BP_NARROW, useMediaQuery } from '../hooks/useMediaQuery'
import { computeAssetTotals } from '../lib/assets'
import { sectionHeader } from '../lib/formKit'
import { useStore } from '../store/useStore'
import type { Asset } from '../types'

const CATEGORY_LABEL: Record<string, string> = {
  cash: 'Cash', bank: 'Bank account', foreign_currency: 'Foreign currency', savings: 'Savings',
  gold: 'Gold', silver: 'Silver', stock: 'Stock', etf: 'ETF', fund: 'Fund', bond: 'Bond', crypto: 'Crypto',
  receivable: 'Receivable', payable: 'Payable', other: 'Other',
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function AssetsView() {
  const isMobile = useMediaQuery(BP_MOBILE)
  const isNarrow = useMediaQuery(BP_NARROW)
  const assets = useStore((s) => s.assets)
  const exchangeRates = useStore((s) => s.exchangeRates)
  const baseCurrency = useStore((s) => s.settings.baseCurrency)
  const snapshots = useStore((s) => s.assetSnapshots)
  const saveAssetSnapshot = useStore((s) => s.saveAssetSnapshot)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const selected = assets.find((a) => a.id === selectedId) ?? null
  const totals = useMemo(() => computeAssetTotals(assets, exchangeRates, baseCurrency), [assets, exchangeRates, baseCurrency])

  const grouped = useMemo(() => {
    const groups = new Map<string, Asset[]>()
    for (const a of assets) {
      if (!groups.has(a.category)) groups.set(a.category, [])
      groups.get(a.category)!.push(a)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [assets])

  const lastUpdated = assets.reduce<string | null>((max, a) => (!max || a.lastUpdated > max ? a.lastUpdated : max), null)
  const maxSnapshot = Math.max(1, ...snapshots.map((s) => Math.abs(s.totalBaseCurrency)))

  const dashboard = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Life</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontSize: isNarrow ? 28 : 38, fontWeight: 400, color: 'var(--fgs)' }}>Assets</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1.4fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'calc(var(--r) + 1px)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px', background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Total estimated assets</div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 32, color: 'var(--fgs)', letterSpacing: '-.02em' }}>
            {fmt(totals.total)} <span style={{ fontSize: 16, color: 'var(--dim)' }}>{baseCurrency}</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>
            {lastUpdated ? `Last updated ${lastUpdated.slice(0, 10)}` : 'No assets yet'}
            {totals.missingRates.length > 0 && ` · no rate set for ${totals.missingRates.join(', ')} (excluded from total)`}
          </div>
        </div>
        <div style={{ padding: '20px 22px', background: 'var(--panel)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <button
            onClick={() => saveAssetSnapshot()}
            className="btn-outline"
            style={{ alignSelf: 'flex-start', padding: '8px 14px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}
          >
            Save snapshot
          </button>
          <div style={{ fontSize: 11, color: 'var(--faint)' }}>Base currency and exchange rates are set in Settings.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 32 }}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sectionHeader('By category')}
          {Object.entries(totals.byCategory).length === 0 && <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>Nothing yet.</div>}
          {Object.entries(totals.byCategory).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).map(([cat, val]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--fg)' }}>{CATEGORY_LABEL[cat] ?? cat}</span>
              <span style={{ fontFamily: 'var(--fm)', color: 'var(--dim2)' }}>{fmt(val)} {baseCurrency}</span>
            </div>
          ))}
        </section>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sectionHeader('By currency')}
          {Object.entries(totals.byCurrency).map(([cur, val]) => (
            <div key={cur} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--fg)' }}>{cur}</span>
              <span style={{ fontFamily: 'var(--fm)', color: 'var(--dim2)' }}>{fmt(val)}</span>
            </div>
          ))}
        </section>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12.5 }}>
        <div><span style={{ color: 'var(--faint)' }}>Gold/silver </span><span style={{ color: 'var(--fgs)', fontFamily: 'var(--fm)' }}>{fmt(totals.goldSilverTotal)}</span></div>
        <div><span style={{ color: 'var(--faint)' }}>Investments </span><span style={{ color: 'var(--fgs)', fontFamily: 'var(--fm)' }}>{fmt(totals.investmentsTotal)}</span></div>
        <div><span style={{ color: 'var(--faint)' }}>Receivable </span><span style={{ color: 'var(--fgs)', fontFamily: 'var(--fm)' }}>{fmt(totals.receivablesTotal)}</span></div>
        <div><span style={{ color: 'var(--faint)' }}>Payable </span><span style={{ color: 'var(--fgs)', fontFamily: 'var(--fm)' }}>{fmt(totals.payablesTotal)}</span></div>
      </div>

      {snapshots.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sectionHeader('History')}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, overflowX: 'auto', paddingBottom: 4 }}>
            {snapshots.map((s) => (
              <div key={s.id} title={`${s.takenAt.slice(0, 10)}: ${fmt(s.totalBaseCurrency)} ${s.baseCurrency}`} style={{ flex: 'none', width: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{ width: '100%', height: `${Math.max(2, (Math.abs(s.totalBaseCurrency) / maxSnapshot) * 100)}%`, background: 'var(--accent)', borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )

  const assetList = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {sectionHeader('Your assets')}
      <button
        onClick={() => { setCreating(true); setSelectedId(null) }}
        className="btn-primary"
        style={{ alignSelf: 'flex-start', padding: '9px 14px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
      >
        + Add asset
      </button>
      {grouped.map(([cat, items]) => (
        <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: '.1em', color: 'var(--faint2)', padding: '6px 4px 4px' }}>{CATEGORY_LABEL[cat] ?? cat}</div>
          {items.map((a) => (
            <button
              key={a.id}
              onClick={() => { setCreating(false); setSelectedId(a.id) }}
              style={{
                display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%', padding: '9px 10px', textAlign: 'left',
                border: `1px solid ${a.id === selectedId ? 'var(--accent)' : 'transparent'}`, borderRadius: 'var(--r)',
                background: a.id === selectedId ? 'var(--hover)' : 'transparent', fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--fg)' }}>{a.name}</span>
              <span style={{ fontFamily: 'var(--fm)', color: 'var(--dim2)', fontSize: 12 }}>{fmt(a.estimatedValue)} {a.currency}</span>
            </button>
          ))}
        </div>
      ))}
      {assets.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>No assets recorded yet.</div>}
    </div>
  )

  const editor = creating ? (
    <AssetForm asset={null} onDone={(a) => { setCreating(false); setSelectedId(a.id) }} onCancel={() => setCreating(false)} />
  ) : selected ? (
    <AssetForm asset={selected} onDone={() => setSelectedId(null)} onCancel={() => setSelectedId(null)} />
  ) : null

  return (
    <div style={{ flex: 1, minWidth: 0, padding: isNarrow ? '24px 18px' : isMobile ? '32px 28px' : '44px 52px', display: 'flex', flexDirection: 'column', gap: 34, maxWidth: 1080 }}>
      {dashboard}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : editor ? '1fr 1fr' : '1fr', gap: isMobile ? 24 : 40 }}>
        {assetList}
        {editor}
      </div>
    </div>
  )
}
