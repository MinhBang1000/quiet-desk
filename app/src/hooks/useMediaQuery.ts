import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// Sidebar collapses to a top bar, two-column sections stack, grids shrink.
export const BP_TABLET = '(max-width: 1179px)'
// Focus view stacks vertically, calendar cells shrink further.
export const BP_MOBILE = '(max-width: 899px)'
// Extra-tight paddings/type scale for phones.
export const BP_NARROW = '(max-width: 480px)'
