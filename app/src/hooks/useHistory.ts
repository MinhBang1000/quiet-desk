import { useMemo } from 'react'
import { buildHistory } from '../lib/derived'
import { useStore } from '../store/useStore'

export function useHistory() {
  const tasks = useStore((s) => s.tasks)
  const sessions = useStore((s) => s.sessions)
  return useMemo(() => buildHistory(tasks, sessions), [tasks, sessions])
}
