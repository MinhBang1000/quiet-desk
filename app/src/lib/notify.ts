import type { Task } from '../types'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function notifyTaskDue(task: Task) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  new Notification('Due today — Quiet Desk', {
    body: task.title,
    tag: `qd-task-${task.id}`,
  })
}
