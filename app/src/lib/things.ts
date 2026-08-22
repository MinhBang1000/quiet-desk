import { locationPath } from './locations'
import type { Location, Thing } from '../types'

/**
 * A Thing's "where is it" answer walks containment first (it's inside
 * another Thing), then falls back to its own physical location — so
 * searching for "HDMI adapter" resolves a breadcrumb immediately even if
 * it's buried three containers deep.
 */
export function resolveThingLocation(thing: Thing, things: Thing[], locations: Location[]): string {
  const byId = new Map(things.map((t) => [t.id, t]))
  const containerNames: string[] = []
  let current = thing
  let hops = 0
  while (current.containerId && hops < 50) {
    const container = byId.get(current.containerId)
    if (!container) break
    containerNames.push(container.name)
    current = container
    hops++
  }
  // `current` is now the outermost item — either the thing itself (no
  // container) or its outermost container — whose own physical location
  // anchors the full breadcrumb.
  const path = current.locationId ? locationPath(current.locationId, locations) : ''
  const parts = [...(path ? [path] : []), ...containerNames]
  return parts.length ? parts.join(' › ') : 'No location set'
}
