import { useRef, useState } from 'react'
import { AvatarCropModal } from './AvatarCropModal'
import { initialsAvatar } from '../lib/image'
import { THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'

interface PhotoPickerProps {
  photoUrl: string
  fallbackName: string
  size?: number
  onChange: (url: string) => void
}

export function PhotoPicker({ photoUrl, fallbackName, size = 128, onChange }: PhotoPickerProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const src = photoUrl || initialsAvatar(fallbackName || '?', theme.accent, theme.ink)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <button
        onClick={() => fileRef.current?.click()}
        style={{ padding: 0, border: '1px solid var(--line2)', borderRadius: '50%', background: 'transparent', cursor: 'pointer', flex: 'none' }}
        title="Change photo"
      >
        <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-outline"
          style={{ padding: '8px 14px', border: '1px solid var(--line2)', borderRadius: 'calc(var(--r) - 2px)', background: 'transparent', color: 'var(--dim)', fontSize: 13, alignSelf: 'flex-start' }}
        >
          Upload photo
        </button>
        {photoUrl && (
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
