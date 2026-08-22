import type { Location } from '../types'

export interface LocationNode extends Location {
  children: LocationNode[]
}

export function buildLocationTree(locations: Location[]): LocationNode[] {
  const byId = new Map<string, LocationNode>()
  for (const l of locations) byId.set(l.id, { ...l, children: [] })
  const roots: LocationNode[] = []
  for (const l of locations) {
    const node = byId.get(l.id)!
    const parent = l.parentId ? byId.get(l.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/** "Taiwan › Apartment › Bedroom › Desk › Drawer 2" */
export function locationPath(id: string | null, locations: Location[]): string {
  return locationAncestors(id, locations)
    .map((l) => l.name)
    .join(' › ')
}

export function locationAncestors(id: string | null, locations: Location[]): Location[] {
  if (!id) return []
  const byId = new Map(locations.map((l) => [l.id, l]))
  const chain: Location[] = []
  let current = byId.get(id)
  let hops = 0
  while (current && hops < 50) {
    chain.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
    hops++
  }
  return chain
}

export function locationChildren(parentId: string | null, locations: Location[]): Location[] {
  return locations.filter((l) => l.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name))
}
