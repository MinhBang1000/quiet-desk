import { useState, type CSSProperties } from 'react'
import { iso } from '../lib/date'
import { tagColor, THEMES } from '../lib/themes'
import { useStore } from '../store/useStore'
import type { Task } from '../types'
import { TagPicker } from './TagPicker'

function taskMeta(task: Task): { text: string; overdue: boolean } {
  const t0 = iso(new Date())
  const overdue = !task.done && task.due < t0
  const label = task.due === t0 ? 'TODAY' : overdue ? 'OVERDUE' : task.due.slice(5)
  return { text: `${task.tag.toUpperCase()} · ${label}`, overdue }
}

interface TaskRowProps {
  task: Task
  compact?: boolean
  showFocusButton?: boolean
  showRemove?: boolean
}

export function TaskRow({ task, compact = false, showFocusButton = false, showRemove = false }: TaskRowProps) {
  const theme = useStore((s) => THEMES[s.theme])
  const tags = useStore((s) => s.tags)
  const activeId = useStore((s) => s.activeId)
  const toggleTask = useStore((s) => s.toggleTask)
  const pickTask = useStore((s) => s.pickTask)
  const removeTask = useStore((s) => s.removeTask)
  const updateTask = useStore((s) => s.updateTask)
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const [draftTag, setDraftTag] = useState(task.tag)
  const [draftDue, setDraftDue] = useState(task.due)

  const active = task.id === activeId
  const color = tagColor(theme, task.tag, tags)
  const meta = taskMeta(task)

  const startEdit = () => {
    setDraftTitle(task.title)
    setDraftTag(task.tag)
    setDraftDue(task.due)
    setEditing(true)
  }

  const saveEdit = () => {
    const title = draftTitle.trim()
    if (title) updateTask(task.id, { title, tag: draftTag, due: draftDue })
    setEditing(false)
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: compact ? 'flex-start' : 'center',
    gap: compact ? 10 : 13,
    padding: compact ? '10px 11px' : '12px 14px',
    borderRadius: 'var(--r)',
    border: `1px solid ${active && compact ? theme.accent + '66' : 'transparent'}`,
    background: active && compact ? 'var(--hover)' : 'transparent',
  }

  const boxStyle: CSSProperties = {
    flex: 'none',
    width: 16,
    height: 16,
    marginTop: compact ? 2 : 0,
    borderRadius: 'calc(var(--r) / 2)',
    cursor: 'pointer',
    border: `1px solid ${task.done ? color : 'var(--faint2)'}`,
    background: task.done ? color : 'transparent',
  }

  const titleStyle: CSSProperties = {
    fontSize: compact ? 13.5 : 15,
    lineHeight: 1.35,
    color: task.done ? 'var(--faint)' : 'var(--fg)',
    textDecoration: task.done ? 'line-through' : 'none',
  }

  const metaBlock = (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 7 : 8, marginTop: compact ? 3 : 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: 5, background: color, flex: 'none' }} />
      <span
        style={{
          fontFamily: 'var(--fm)',
          fontSize: 10,
          letterSpacing: '.08em',
          color: meta.overdue ? theme.accent : 'var(--faint)',
        }}
      >
        {meta.text}
      </span>
    </div>
  )

  if (compact) {
    return (
      <div className="task-row-compact" style={rowStyle}>
        <button onClick={() => toggleTask(task.id)} style={boxStyle} />
        <button
          onClick={() => pickTask(task.id)}
          style={{ flex: 1, minWidth: 0, padding: 0, border: 0, background: 'transparent', textAlign: 'left' }}
        >
          <div style={titleStyle}>{task.title}</div>
          {metaBlock}
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="task-row-full" style={{ ...rowStyle, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button onClick={() => toggleTask(task.id)} style={boxStyle} />
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
            style={{
              flex: 1,
              minWidth: 0,
              border: '1px solid var(--line2)',
              borderRadius: 'calc(var(--r) - 2px)',
              background: 'var(--bg)',
              padding: '6px 9px',
              fontSize: 14,
              color: 'var(--fg)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <TagPicker value={draftTag} onChange={setDraftTag} />
            <input
              type="date"
              value={draftDue}
              onChange={(e) => setDraftDue(e.target.value)}
              style={{
                border: '1px solid var(--line2)',
                borderRadius: 'calc(var(--r) - 2px)',
                background: 'var(--bg)',
                padding: '5px 8px',
                fontSize: 12.5,
                color: 'var(--fg)',
                fontFamily: 'var(--fm)',
              }}
            />
            <button
              onClick={saveEdit}
              className="btn-primary"
              style={{ padding: '6px 12px', border: 0, borderRadius: 'calc(var(--r) - 2px)', background: 'var(--accent)', color: 'var(--ink)', fontSize: 12 }}
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-text"
              style={{ padding: '6px 10px', border: 0, background: 'transparent', color: 'var(--faint)', fontSize: 12 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="task-row-full" style={rowStyle}>
      <button onClick={() => toggleTask(task.id)} style={boxStyle} />
      <button
        onClick={startEdit}
        style={{ flex: 1, minWidth: 0, padding: 0, border: 0, background: 'transparent', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <div style={titleStyle}>{task.title}</div>
        {metaBlock}
      </button>
      {showFocusButton && (
        <button
          onClick={() => pickTask(task.id)}
          className="btn-focus-inline"
          style={{
            flex: 'none',
            padding: '7px 12px',
            border: '1px solid var(--line2)',
            borderRadius: 'calc(var(--r) - 2px)',
            background: 'transparent',
            color: 'var(--dim)',
            fontSize: 12,
          }}
        >
          Focus
        </button>
      )}
      {showRemove && (
        <button
          onClick={() => removeTask(task.id)}
          className="btn-delete"
          style={{
            flex: 'none',
            padding: '7px 9px',
            border: 0,
            borderRadius: 'calc(var(--r) - 2px)',
            background: 'transparent',
            color: 'var(--faint2)',
            fontSize: 13,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
