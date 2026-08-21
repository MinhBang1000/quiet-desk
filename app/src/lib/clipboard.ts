/**
 * navigator.clipboard needs a secure context — it's silently unavailable
 * when this app is reached over plain HTTP via a LAN/WSL IP instead of
 * localhost, which is exactly how a self-hosted single-user app tends to
 * get opened. Falls back to the old execCommand('copy') trick, which works
 * in more contexts, so the button doesn't just quietly do nothing.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to the legacy path below
    }
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.top = '-1000px'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}
