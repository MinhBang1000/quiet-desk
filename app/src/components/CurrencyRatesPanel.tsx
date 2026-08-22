import { useState } from 'react'
import { useStore } from '../store/useStore'

export function CurrencyRatesPanel() {
  const baseCurrency = useStore((s) => s.settings.baseCurrency)
  const updateSettings = useStore((s) => s.updateSettings)
  const exchangeRates = useStore((s) => s.exchangeRates)
  const setExchangeRates = useStore((s) => s.setExchangeRates)

  const [baseDraft, setBaseDraft] = useState(baseCurrency)
  const [rows, setRows] = useState(exchangeRates.map((r) => ({ currency: r.currency, rateToBase: String(r.rateToBase) })))

  const commitBase = () => {
    const v = baseDraft.trim().toUpperCase()
    if (v && v !== baseCurrency) updateSettings({ baseCurrency: v })
    setBaseDraft(v || baseCurrency)
  }

  const saveRates = () => {
    setExchangeRates(
      rows
        .filter((r) => r.currency.trim() && r.rateToBase.trim())
        .map((r) => ({ currency: r.currency.trim().toUpperCase(), rateToBase: Number(r.rateToBase) }))
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, border: '1px solid var(--line)', borderRadius: 'calc(var(--r) + 1px)', background: 'var(--panel)' }}>
      <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>Base currency & rates</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12.5, color: 'var(--dim)' }}>Base currency</span>
        <input
          value={baseDraft}
          onChange={(e) => setBaseDraft(e.target.value)}
          onBlur={commitBase}
          onKeyDown={(e) => { if (e.key === 'Enter') commitBase() }}
          style={{ width: 70, textAlign: 'center', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '4px 6px', fontSize: 12.5, color: 'var(--fg)' }}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--faint)' }}>1 unit of each currency below = this many units of {baseCurrency}.</div>

      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 6 }}>
          <input
            value={row.currency}
            onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, currency: e.target.value.toUpperCase() } : x)))}
            placeholder="USD"
            style={{ width: 70, border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '4px 6px', fontSize: 12.5, color: 'var(--fg)' }}
          />
          <input
            type="number"
            value={row.rateToBase}
            onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, rateToBase: e.target.value } : x)))}
            placeholder="32.5"
            style={{ flex: 1, border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 3px)', background: 'var(--bg)', padding: '4px 6px', fontSize: 12.5, color: 'var(--fg)' }}
          />
          <button onClick={() => setRows((r) => r.filter((_, j) => j !== i))} style={{ padding: '2px 6px', border: 0, background: 'transparent', color: 'var(--faint2)', fontSize: 13 }}>×</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setRows((r) => [...r, { currency: '', rateToBase: '' }])}
          style={{ flex: 1, border: '1px dashed var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', padding: '6px 8px', fontSize: 12.5, color: 'var(--fg)' }}
        >
          + Add currency
        </button>
        <button
          onClick={saveRates}
          className="btn-outline"
          style={{ padding: '6px 12px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 12.5 }}
        >
          Save rates
        </button>
      </div>
    </div>
  )
}
