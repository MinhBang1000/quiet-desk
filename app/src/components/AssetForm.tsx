import { useState } from 'react'
import { Field } from './FormKit'
import { inputStyle, sectionHeader } from '../lib/formKit'
import { useStore } from '../store/useStore'
import type { Asset, AssetCategory, AssetDetails } from '../types'

const CATEGORY_OPTIONS: { id: AssetCategory; label: string }[] = [
  { id: 'cash', label: 'Cash' }, { id: 'bank', label: 'Bank account' }, { id: 'foreign_currency', label: 'Foreign currency' },
  { id: 'savings', label: 'Savings / fixed deposit' }, { id: 'gold', label: 'Gold' }, { id: 'silver', label: 'Silver' },
  { id: 'stock', label: 'Stock' }, { id: 'etf', label: 'ETF' }, { id: 'fund', label: 'Fund' }, { id: 'bond', label: 'Bond' },
  { id: 'crypto', label: 'Crypto' }, { id: 'receivable', label: 'Receivable (owed to me)' }, { id: 'payable', label: 'Payable (I owe)' },
  { id: 'other', label: 'Other' },
]

const CASH_LIKE = new Set(['cash', 'bank', 'foreign_currency', 'savings']);
const METAL = new Set(['gold', 'silver']);
const INVESTMENT = new Set(['stock', 'etf', 'fund', 'bond', 'crypto']);
const COUNTERPARTY = new Set(['receivable', 'payable']);

interface AssetFormProps {
  asset: Asset | null
  onDone: (asset: Asset) => void
  onCancel: () => void
}

export function AssetForm({ asset, onDone, onCancel }: AssetFormProps) {
  const addAsset = useStore((s) => s.addAsset)
  const updateAsset = useStore((s) => s.updateAsset)
  const removeAsset = useStore((s) => s.removeAsset)
  const people = useStore((s) => s.people)

  const [name, setName] = useState(asset?.name ?? '')
  const [category, setCategory] = useState<AssetCategory>(asset?.category ?? 'cash')
  const [currency, setCurrency] = useState(asset?.currency ?? 'TWD')
  const [estimatedValue, setEstimatedValue] = useState(String(asset?.estimatedValue ?? ''))
  const [counterpartyPersonId, setCounterpartyPersonId] = useState(asset?.counterpartyPersonId ?? '')
  const [notes, setNotes] = useState(asset?.notes ?? '')
  const [details, setDetails] = useState<AssetDetails>(asset?.details ?? {})

  const setDetail = <K extends keyof AssetDetails>(key: K, value: AssetDetails[K]) => setDetails((d) => ({ ...d, [key]: value }))

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const payload = {
      name: trimmed, category, currency, estimatedValue: Number(estimatedValue) || 0,
      counterpartyPersonId: COUNTERPARTY.has(category) ? counterpartyPersonId || null : null,
      details, notes,
    }
    if (asset) {
      await updateAsset(asset.id, payload)
      onDone({ ...asset, ...payload })
    } else {
      const created = await addAsset(payload)
      onDone(created)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 480 }}>
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus placeholder="e.g. Taiwan Bank, Gold 9999, TSMC" />
      </Field>

      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)} style={inputStyle}>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </Field>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label={category === 'payable' ? 'Amount owed' : 'Estimated value'}>
            <input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: '0 0 100px' }}>
          <Field label="Currency">
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} style={inputStyle} />
          </Field>
        </div>
      </div>

      {CASH_LIKE.has(category) && (
        <Field label="Institution">
          <input value={details.institution ?? ''} onChange={(e) => setDetail('institution', e.target.value)} style={inputStyle} />
        </Field>
      )}

      {METAL.has(category) && (
        <>
          {sectionHeader('Metal details')}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}>
              <Field label="Purity">
                <input value={details.purity ?? ''} onChange={(e) => setDetail('purity', e.target.value)} style={inputStyle} placeholder="9999" />
              </Field>
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <Field label="Quantity">
                <input type="number" value={details.quantity ?? ''} onChange={(e) => setDetail('quantity', Number(e.target.value) || undefined)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <Field label="Weight">
                <input type="number" value={details.weight ?? ''} onChange={(e) => setDetail('weight', Number(e.target.value) || undefined)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <Field label="Unit">
                <input value={details.unit ?? ''} onChange={(e) => setDetail('unit', e.target.value)} style={inputStyle} placeholder="gram / tael / chỉ" />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <Field label="Purchase price">
                <input type="number" value={details.purchasePrice ?? ''} onChange={(e) => setDetail('purchasePrice', Number(e.target.value) || undefined)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <Field label="Purchase date">
                <input type="date" value={details.purchaseDate ?? ''} onChange={(e) => setDetail('purchaseDate', e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <Field label="Current reference price">
                <input type="number" value={details.referencePrice ?? ''} onChange={(e) => setDetail('referencePrice', Number(e.target.value) || undefined)} style={inputStyle} />
              </Field>
            </div>
          </div>
        </>
      )}

      {INVESTMENT.has(category) && (
        <>
          {sectionHeader('Position details')}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}>
              <Field label="Symbol">
                <input value={details.symbol ?? ''} onChange={(e) => setDetail('symbol', e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <Field label="Quantity">
                <input type="number" value={details.quantity ?? ''} onChange={(e) => setDetail('quantity', Number(e.target.value) || undefined)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <Field label="Avg cost">
                <input type="number" value={details.avgCost ?? ''} onChange={(e) => setDetail('avgCost', Number(e.target.value) || undefined)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <Field label="Current reference value">
                <input type="number" value={details.referenceValue ?? ''} onChange={(e) => setDetail('referenceValue', Number(e.target.value) || undefined)} style={inputStyle} />
              </Field>
            </div>
          </div>
        </>
      )}

      {COUNTERPARTY.has(category) && (
        <Field label={category === 'receivable' ? 'Who owes you' : 'Who you owe'}>
          <select value={counterpartyPersonId} onChange={(e) => setCounterpartyPersonId(e.target.value)} style={inputStyle}>
            <option value="">No one linked</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </Field>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={save} className="btn-primary" style={{ padding: '11px 22px', border: 0, borderRadius: 'var(--r)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600 }}>
          {asset ? 'Save' : 'Add asset'}
        </button>
        <button onClick={onCancel} className="btn-text" style={{ padding: '11px 14px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 13.5 }}>
          Cancel
        </button>
        {asset && (
          <button
            onClick={() => {
              if (window.confirm(`Remove ${asset.name}? This can't be undone.`)) {
                removeAsset(asset.id)
                onCancel()
              }
            }}
            className="btn-text"
            style={{ marginLeft: 'auto', padding: '11px 10px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12.5 }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
