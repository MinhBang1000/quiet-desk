import type { CSSProperties } from 'react'
import type { Theme } from './themes'

export type BgArtId =
  | 'skyline-neon'
  | 'skyline-noir'
  | 'skyline-smoky'
  | 'zen-circle'
  | 'mountains'
  | 'dunes'
  | 'waves'
  | 'arch-tile'
  | 'code-rain'
  | 'starfield'
  | 'symmetric-frame'
  | 'claw-slashes'
  | 'reactor-glow'
  | 'web-lines'
  | 'rage-cracks'
  | 'shield-rings'
  | 'toxic-glow'
  | 'gem-sparkle'

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// A tileable city skyline silhouette, repeated horizontally along the bottom edge.
function skylineSvg(fill: string, glow: string): string {
  const heights = [40, 70, 55, 92, 65, 100, 50, 82, 60, 46]
  const h = 110
  let x = 0
  let rects = ''
  let windows = ''
  heights.forEach((bh, i) => {
    const bw = 34 + (i % 3) * 6
    const y = h - bh
    rects += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${fill}"/>`
    if (i % 2 === 0) {
      windows += `<rect x="${x + bw * 0.3}" y="${y + bh * 0.25}" width="3" height="3" fill="${glow}"/>`
      windows += `<rect x="${x + bw * 0.6}" y="${y + bh * 0.55}" width="3" height="3" fill="${glow}"/>`
    }
    x += bw + 6
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${h}" viewBox="0 0 ${x} ${h}">${rects}${windows}</svg>`
}

function wavesSvg(fill: string): string {
  const w = 200
  const h = 36
  const d = `M0,${h * 0.5} C25,${h * 0.1} 50,${h * 0.1} 75,${h * 0.5} C100,${h * 0.9} 125,${h * 0.9} 150,${h * 0.5} C175,${h * 0.1} 200,${h * 0.1} 200,${h * 0.5} V${h} H0 Z`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d}" fill="${fill}"/></svg>`
}

function mountainsSvg(back: string, front: string): string {
  const w = 320
  const h = 130
  const backPath = `M0,${h} L0,60 L60,20 L120,70 L180,15 L240,65 L320,10 L320,${h} Z`
  const frontPath = `M0,${h} L0,90 L50,45 L100,95 L160,40 L220,90 L280,50 L320,85 L320,${h} Z`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${backPath}" fill="${back}"/><path d="${frontPath}" fill="${front}"/></svg>`
}

function dunesSvg(fill: string): string {
  const w = 340
  const h = 90
  const d = `M0,${h} L0,55 C40,30 80,70 130,45 C180,20 230,60 280,35 C300,25 320,40 340,30 L340,${h} Z`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d}" fill="${fill}"/></svg>`
}

function archTileSvg(stroke: string): string {
  const w = 90
  const h = 130
  const d = `M10,${h - 10} V60 C10,25 30,10 45,10 C60,10 80,25 80,60 V${h - 10}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.5"/></svg>`
}

// A hand-drawn-style ensō ring with a deliberate gap in the stroke.
function zenCircleSvg(stroke: string): string {
  const size = 440
  const r = size / 2 - 20
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const gap = circumference * 0.08
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${circumference - gap} ${gap}" transform="rotate(-100 ${cx} ${cy})"/></svg>`
}

export function getThemeBackgroundStyle(theme: Theme): CSSProperties {
  const base: CSSProperties = { backgroundColor: theme.bg }

  switch (theme.bgArt) {
    case 'skyline-neon': {
      const sky = svgUrl(skylineSvg(hexToRgba(theme.line2, 0.55), theme.accent))
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at 85% 12%, ${hexToRgba(theme.accent, 0.1)}, transparent 45%), ${sky}`,
        backgroundRepeat: 'no-repeat, repeat-x',
        backgroundPosition: 'top right, bottom left',
        backgroundSize: 'auto, auto 110px',
      }
    }
    case 'skyline-noir': {
      const sky = svgUrl(skylineSvg(hexToRgba(theme.line2, 0.6), hexToRgba(theme.accent, 0.5)))
      return {
        ...base,
        backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 0%, ${hexToRgba(theme.accent, 0.08)}, transparent 60%), ${sky}`,
        backgroundRepeat: 'no-repeat, repeat-x',
        backgroundPosition: 'top center, bottom left',
        backgroundSize: 'auto, auto 110px',
      }
    }
    case 'skyline-smoky': {
      const sky = svgUrl(skylineSvg(hexToRgba(theme.line2, 0.55), hexToRgba(theme.accent, 0.4)))
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at 88% 10%, ${hexToRgba(theme.accent, 0.14)}, transparent 12%), ${sky}`,
        backgroundRepeat: 'no-repeat, repeat-x',
        backgroundPosition: 'top right, bottom left',
        backgroundSize: 'auto, auto 100px',
      }
    }
    case 'zen-circle':
      return {
        ...base,
        backgroundImage: svgUrl(zenCircleSvg(hexToRgba(theme.accent, 0.14))),
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right -60px bottom -60px',
        backgroundSize: '440px 440px',
      }
    case 'mountains':
      return {
        ...base,
        backgroundImage: svgUrl(mountainsSvg(hexToRgba(theme.line2, 0.5), hexToRgba(theme.accent, 0.14))),
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'bottom',
        backgroundSize: 'auto 160px',
      }
    case 'dunes':
      return {
        ...base,
        backgroundImage: svgUrl(dunesSvg(hexToRgba(theme.accent, 0.1))),
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'bottom',
        backgroundSize: 'auto 120px',
      }
    case 'waves':
      return {
        ...base,
        backgroundImage: svgUrl(wavesSvg(hexToRgba(theme.accent, 0.1))),
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'bottom',
        backgroundSize: 'auto 60px',
      }
    case 'arch-tile':
      return {
        ...base,
        backgroundImage: svgUrl(archTileSvg(hexToRgba(theme.accent, 0.1))),
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        backgroundSize: '90px 130px',
      }
    case 'code-rain':
      return {
        ...base,
        backgroundImage: [
          `repeating-linear-gradient(180deg, ${hexToRgba(theme.accent, 0.05)} 0px, ${hexToRgba(theme.accent, 0.05)} 3px, transparent 3px, transparent 22px)`,
          `repeating-linear-gradient(90deg, transparent 0px, transparent 26px, ${hexToRgba(theme.accent, 0.035)} 26px, ${hexToRgba(theme.accent, 0.035)} 28px)`,
        ].join(', '),
      }
    case 'starfield':
      return {
        ...base,
        backgroundImage: [
          `radial-gradient(circle at 82% 18%, ${hexToRgba(theme.accent, 0.14)}, transparent 40%)`,
          `radial-gradient(circle, ${hexToRgba(theme.fgs, 0.5)} 1px, transparent 1.4px)`,
        ].join(', '),
        backgroundRepeat: 'no-repeat, repeat',
        backgroundSize: 'auto, 46px 46px',
      }
    case 'symmetric-frame':
      return {
        ...base,
        backgroundImage: `linear-gradient(90deg, transparent calc(50% - 1px), ${hexToRgba(theme.accent, 0.08)} calc(50% - 1px), ${hexToRgba(theme.accent, 0.08)} calc(50% + 1px), transparent calc(50% + 1px))`,
        boxShadow: `inset 0 0 0 10px ${hexToRgba(theme.accent, 0.05)}, inset 0 0 0 11px ${hexToRgba(theme.accent, 0.12)}`,
      }
    case 'claw-slashes':
      return {
        ...base,
        backgroundImage: `repeating-linear-gradient(115deg, transparent 0px, transparent 90px, ${hexToRgba(theme.accent, 0.06)} 90px, ${hexToRgba(theme.accent, 0.06)} 98px, transparent 98px, transparent 220px)`,
      }
    case 'reactor-glow':
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at 15% 88%, ${hexToRgba(theme.ok, 0.14)}, transparent 32%), radial-gradient(circle at 88% 10%, ${hexToRgba(theme.accent, 0.12)}, transparent 35%)`,
      }
    case 'web-lines':
      return {
        ...base,
        backgroundImage: `repeating-conic-gradient(from 0deg at 92% 6%, transparent 0deg 12deg, ${hexToRgba(theme.accent, 0.05)} 12deg 13deg, transparent 13deg 30deg)`,
        WebkitMaskImage: `radial-gradient(circle at 92% 6%, black, transparent 65%)`,
        maskImage: `radial-gradient(circle at 92% 6%, black, transparent 65%)`,
      }
    case 'rage-cracks':
      return {
        ...base,
        backgroundImage: `repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 20deg, ${hexToRgba(theme.accent, 0.06)} 20deg 21.5deg, transparent 21.5deg 46deg)`,
        WebkitMaskImage: `radial-gradient(circle at 50% 100%, black, transparent 60%)`,
        maskImage: `radial-gradient(circle at 50% 100%, black, transparent 60%)`,
      }
    case 'shield-rings':
      return {
        ...base,
        backgroundImage: `repeating-radial-gradient(circle at 88% 88%, transparent 0px, transparent 30px, ${hexToRgba(theme.accent, 0.07)} 30px, ${hexToRgba(theme.accent, 0.07)} 34px, transparent 34px, transparent 64px, ${hexToRgba(theme.ok, 0.06)} 64px, ${hexToRgba(theme.ok, 0.06)} 68px)`,
      }
    case 'toxic-glow':
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at 12% 92%, ${hexToRgba(theme.accent, 0.14)}, transparent 35%), radial-gradient(circle at 90% 8%, ${hexToRgba(theme.ok, 0.1)}, transparent 35%)`,
      }
    case 'gem-sparkle':
      return {
        ...base,
        backgroundImage: [
          `radial-gradient(circle at 20% 25%, rgba(78,134,201,0.14), transparent 10%)`,
          `radial-gradient(circle at 75% 20%, rgba(78,168,62,0.14), transparent 10%)`,
          `radial-gradient(circle at 30% 78%, rgba(224,57,43,0.14), transparent 10%)`,
          `radial-gradient(circle at 85% 82%, rgba(139,78,201,0.14), transparent 10%)`,
          `radial-gradient(circle at 55% 50%, ${hexToRgba(theme.accent, 0.14)}, transparent 12%)`,
          `radial-gradient(circle, ${hexToRgba(theme.accent, 0.4)} 1px, transparent 1.4px)`,
        ].join(', '),
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, repeat',
        backgroundSize: 'auto, auto, auto, auto, auto, 50px 50px',
      }
    default:
      return base
  }
}
