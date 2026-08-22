import type { BgArtId } from './bgArt'
import type { Tag } from '../types'

export type ThemeId =
  | 'night'
  | 'paper'
  | 'studio'
  | 'terminal'
  | 'tokyo'
  | 'kyoto'
  | 'nordic'
  | 'sahara'
  | 'amalfi'
  | 'marrakech'
  | 'matrix'
  | 'nebula'
  | 'wes'
  | 'jazz'
  | 'wolverine'
  | 'ironman'
  | 'spiderman'
  | 'hulk'
  | 'cap'
  | 'gotham'
  | 'venom'
  | 'thanos'

export interface Theme {
  id: ThemeId
  label: string
  bg: string
  panel: string
  line: string
  hover: string
  line2: string
  fg: string
  fgs: string
  dim: string
  dim2: string
  faint: string
  faint2: string
  track: string
  accent: string
  ink: string
  ok: string
  r: string
  fd: string
  fu: string
  fm: string
  tags: [string, string, string, string]
  heat: [string, string, string, string, string]
  bgArt?: BgArtId
}

export const THEMES: Record<ThemeId, Theme> = {
  night: {
    id: 'night',
    label: 'Night desk',
    bg: '#0B0B0A', panel: '#0E0E0C', line: '#1B1A17', hover: '#171613', line2: '#26241F',
    fg: '#ECE7DD', fgs: '#F3EFE6', dim: '#9A9488', dim2: '#7C766A', faint: '#5E594F', faint2: '#3A3730',
    track: '#141310', accent: '#B4552D', ink: '#120D08', ok: '#7C9A54', r: '9px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#B4552D', '#7C9A54', '#8A6BA8', '#4E86A6'],
    heat: ['#141310', 'rgba(180,85,45,.28)', 'rgba(180,85,45,.5)', 'rgba(180,85,45,.74)', '#D0693A'],
  },
  paper: {
    id: 'paper',
    label: 'Paper & ink',
    bg: '#F4F1E9', panel: '#FBF9F3', line: '#E3DDCE', hover: '#EDE8DA', line2: '#D5CDB9',
    fg: '#26241D', fgs: '#14130F', dim: '#5C5748', dim2: '#6E6857', faint: '#8B8471', faint2: '#B3AC97',
    track: '#E8E3D5', accent: '#A8481F', ink: '#FFF8EF', ok: '#5C7A38', r: '6px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#A8481F', '#5C7A38', '#6B4E8A', '#2F6684'],
    heat: ['#E8E3D5', 'rgba(168,72,31,.22)', 'rgba(168,72,31,.42)', 'rgba(168,72,31,.66)', '#A8481F'],
  },
  studio: {
    id: 'studio',
    label: 'Bright studio',
    bg: '#FFFFFF', panel: '#FAFAF8', line: '#ECEBE7', hover: '#F4F3F0', line2: '#DEDDD8',
    fg: '#1B1B19', fgs: '#000000', dim: '#5A5A55', dim2: '#77776F', faint: '#91918A', faint2: '#BFBFB8',
    track: '#F0F0EC', accent: '#C2542A', ink: '#FFFFFF', ok: '#4F7A33', r: '4px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#C2542A', '#4F7A33', '#61479B', '#1F6288'],
    heat: ['#F0F0EC', 'rgba(194,84,42,.2)', 'rgba(194,84,42,.4)', 'rgba(194,84,42,.66)', '#C2542A'],
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    bg: '#0C1210', panel: '#0F1614', line: '#1B2521', hover: '#16201C', line2: '#26332E',
    fg: '#D3E0D8', fgs: '#EAF3ED', dim: '#93A69B', dim2: '#7B8D83', faint: '#5C6B62', faint2: '#3A4741',
    track: '#131C18', accent: '#C4913A', ink: '#0C1210', ok: '#6FA36B', r: '2px',
    fd: '"IBM Plex Mono", monospace', fu: '"IBM Plex Mono", monospace', fm: '"IBM Plex Mono", monospace',
    tags: ['#C4913A', '#6FA36B', '#9B7BC0', '#4E93A6'],
    heat: ['#131C18', 'rgba(196,145,58,.24)', 'rgba(196,145,58,.45)', 'rgba(196,145,58,.7)', '#C4913A'],
  },

  // --- movie & country inspired ---

  tokyo: {
    id: 'tokyo',
    label: 'Tokyo Neon',
    bg: '#08080F', panel: '#0C0C16', line: '#1A1A2E', hover: '#15151F', line2: '#26263D',
    fg: '#D8D8F0', fgs: '#F2F0FF', dim: '#8B8BA8', dim2: '#6E6E8C', faint: '#4A4A66', faint2: '#2C2C42',
    track: '#0F0F1C', accent: '#FF2E88', ink: '#0A0510', ok: '#2EE6D6', r: '8px',
    fd: '"IBM Plex Mono", monospace', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#FF2E88', '#2EE6D6', '#FFD23F', '#7B61FF'],
    heat: ['#0F0F1C', 'rgba(255,46,136,.25)', 'rgba(255,46,136,.45)', 'rgba(255,46,136,.7)', '#FF2E88'],
    bgArt: 'skyline-neon',
  },
  kyoto: {
    id: 'kyoto',
    label: 'Kyoto Zen',
    bg: '#F6F3EC', panel: '#FCFAF5', line: '#E6E0D1', hover: '#EFE9DC', line2: '#D6CEB8',
    fg: '#2B2A22', fgs: '#151410', dim: '#635C48', dim2: '#75705C', faint: '#948C72', faint2: '#B8B096',
    track: '#EAE4D4', accent: '#6B7A4F', ink: '#FBF9F2', ok: '#8FA36B', r: '5px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#6B7A4F', '#9C6B4A', '#5E7A8C', '#A88B4A'],
    heat: ['#EAE4D4', 'rgba(107,122,79,.22)', 'rgba(107,122,79,.42)', 'rgba(107,122,79,.66)', '#6B7A4F'],
    bgArt: 'zen-circle',
  },
  nordic: {
    id: 'nordic',
    label: 'Nordic Fjord',
    bg: '#141A22', panel: '#182029', line: '#232E3A', hover: '#1C2530', line2: '#2E3D4C',
    fg: '#DCE4EA', fgs: '#F0F5F8', dim: '#8FA0AD', dim2: '#71838F', faint: '#4F616D', faint2: '#324150',
    track: '#101820', accent: '#4FA3C4', ink: '#081015', ok: '#6FBF8B', r: '6px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#4FA3C4', '#6FBF8B', '#8C7AB8', '#C4914F'],
    heat: ['#101820', 'rgba(79,163,196,.22)', 'rgba(79,163,196,.42)', 'rgba(79,163,196,.66)', '#4FA3C4'],
    bgArt: 'mountains',
  },
  sahara: {
    id: 'sahara',
    label: 'Sahara Dusk',
    bg: '#F2E8D8', panel: '#FAF3E6', line: '#E5D5B8', hover: '#EDDFC5', line2: '#D6C29C',
    fg: '#3A2E1E', fgs: '#211A10', dim: '#6B5A3E', dim2: '#7D6B4C', faint: '#A08E68', faint2: '#C4B08A',
    track: '#E9DABB', accent: '#C1592E', ink: '#FFF6E8', ok: '#7A8F4A', r: '5px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#C1592E', '#7A8F4A', '#8A5A7A', '#3E7A8C'],
    heat: ['#E9DABB', 'rgba(193,89,46,.22)', 'rgba(193,89,46,.42)', 'rgba(193,89,46,.66)', '#C1592E'],
    bgArt: 'dunes',
  },
  amalfi: {
    id: 'amalfi',
    label: 'Amalfi Coast',
    bg: '#F3F6F6', panel: '#FCFEFE', line: '#DCE7E8', hover: '#EAF2F2', line2: '#C6D9DB',
    fg: '#1E2C2E', fgs: '#0A1516', dim: '#4F6669', dim2: '#63797C', faint: '#8CA3A5', faint2: '#B7CACC',
    track: '#E2EDEE', accent: '#1F7A9E', ink: '#FFFFFF', ok: '#3E9C6B', r: '8px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#1F7A9E', '#3E9C6B', '#C9A227', '#C1592E'],
    heat: ['#E2EDEE', 'rgba(31,122,158,.2)', 'rgba(31,122,158,.4)', 'rgba(31,122,158,.66)', '#1F7A9E'],
    bgArt: 'waves',
  },
  marrakech: {
    id: 'marrakech',
    label: 'Marrakech',
    bg: '#0F1A1A', panel: '#132121', line: '#1E3232', hover: '#182828', line2: '#2A4444',
    fg: '#DCE8E4', fgs: '#F2F8F5', dim: '#87A39D', dim2: '#6C8781', faint: '#4A625D', faint2: '#2E403C',
    track: '#0C1616', accent: '#C98A3E', ink: '#140C04', ok: '#5FA37A', r: '4px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#C98A3E', '#5FA37A', '#B85C6B', '#4E86A6'],
    heat: ['#0C1616', 'rgba(201,138,62,.24)', 'rgba(201,138,62,.45)', 'rgba(201,138,62,.7)', '#C98A3E'],
    bgArt: 'arch-tile',
  },
  matrix: {
    id: 'matrix',
    label: 'Matrix Code',
    bg: '#000000', panel: '#040A04', line: '#0F2010', hover: '#081408', line2: '#173318',
    fg: '#8FE89A', fgs: '#B9FFC2', dim: '#4E9457', dim2: '#3D7645', faint: '#2A5230', faint2: '#173318',
    track: '#020602', accent: '#22E048', ink: '#000A00', ok: '#4EE0C0', r: '2px',
    fd: '"IBM Plex Mono", monospace', fu: '"IBM Plex Mono", monospace', fm: '"IBM Plex Mono", monospace',
    tags: ['#22E048', '#6FE0C4', '#E0D622', '#4EA8E0'],
    heat: ['#020602', 'rgba(34,224,72,.24)', 'rgba(34,224,72,.45)', 'rgba(34,224,72,.7)', '#22E048'],
    bgArt: 'code-rain',
  },
  nebula: {
    id: 'nebula',
    label: 'Nebula',
    bg: '#0B0B1A', panel: '#0F0F22', line: '#1D1D38', hover: '#161630', line2: '#2B2B4E',
    fg: '#DEDCF5', fgs: '#F3F1FF', dim: '#8E8CB8', dim2: '#716F98', faint: '#4C4A70', faint2: '#2E2C4A',
    track: '#0A0A18', accent: '#8B6FE8', ink: '#0A0714', ok: '#5FCBE0', r: '10px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#8B6FE8', '#5FCBE0', '#E86FA8', '#E8C56F'],
    heat: ['#0A0A18', 'rgba(139,111,232,.24)', 'rgba(139,111,232,.45)', 'rgba(139,111,232,.7)', '#8B6FE8'],
    bgArt: 'starfield',
  },
  wes: {
    id: 'wes',
    label: 'Wes Pastel',
    bg: '#F6E9E4', panel: '#FDF4F0', line: '#EAD3C8', hover: '#F2DED4', line2: '#DFC0AF',
    fg: '#3E2A24', fgs: '#211410', dim: '#77584C', dim2: '#8A6A5B', faint: '#B4917F', faint2: '#D6B7A5',
    track: '#F0DDD2', accent: '#C98B2E', ink: '#FFF7EE', ok: '#7A9A6B', r: '7px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#C98B2E', '#7A9A6B', '#B75D6B', '#5E7FA0'],
    heat: ['#F0DDD2', 'rgba(201,139,46,.22)', 'rgba(201,139,46,.42)', 'rgba(201,139,46,.66)', '#C98B2E'],
    bgArt: 'symmetric-frame',
  },
  jazz: {
    id: 'jazz',
    label: 'Midnight Jazz',
    bg: '#0D0D12', panel: '#121218', line: '#1F1F28', hover: '#181820', line2: '#2E2E3A',
    fg: '#E6E1D6', fgs: '#F5F1E6', dim: '#9A9384', dim2: '#7C7568', faint: '#59544A', faint2: '#38352E',
    track: '#101014', accent: '#D4A24E', ink: '#120D04', ok: '#7C9A8A', r: '6px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#D4A24E', '#7C9A8A', '#8A6BA8', '#A65454'],
    heat: ['#101014', 'rgba(212,162,78,.24)', 'rgba(212,162,78,.45)', 'rgba(212,162,78,.7)', '#D4A24E'],
    bgArt: 'skyline-smoky',
  },

  // --- superhero inspired ---

  wolverine: {
    id: 'wolverine',
    label: 'Wolverine',
    bg: '#0A0A0C', panel: '#0E0E12', line: '#1E1E24', hover: '#16161B', line2: '#2C2C36',
    fg: '#E8E4D8', fgs: '#F5F2E6', dim: '#9C9488', dim2: '#7E766A', faint: '#544E44', faint2: '#332F28',
    track: '#121216', accent: '#E8A82E', ink: '#140F02', ok: '#3E5C9E', r: '3px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#E8A82E', '#3E5C9E', '#A63A3A', '#6B6B76'],
    heat: ['#121216', 'rgba(232,168,46,.22)', 'rgba(232,168,46,.42)', 'rgba(232,168,46,.68)', '#E8A82E'],
    bgArt: 'claw-slashes',
  },
  ironman: {
    id: 'ironman',
    label: 'Iron Man',
    bg: '#160A08', panel: '#1C0E0B', line: '#331711', hover: '#26100C', line2: '#47201A',
    fg: '#F0DCCB', fgs: '#FBEFE2', dim: '#B38A75', dim2: '#946F5C', faint: '#6B4C3E', faint2: '#452F26',
    track: '#1A0D0A', accent: '#E0392B', ink: '#160502', ok: '#3FD0E0', r: '5px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#E0392B', '#E8B23E', '#3FD0E0', '#8A4A2E'],
    heat: ['#1A0D0A', 'rgba(224,57,43,.24)', 'rgba(224,57,43,.45)', 'rgba(224,57,43,.7)', '#E0392B'],
    bgArt: 'reactor-glow',
  },
  spiderman: {
    id: 'spiderman',
    label: 'Spider-Man',
    bg: '#080E1C', panel: '#0B1327', line: '#18244A', hover: '#0F1830', line2: '#243768',
    fg: '#DCE4F5', fgs: '#F1F5FF', dim: '#8496C4', dim2: '#6C7EA8', faint: '#485A88', faint2: '#2C3B60',
    track: '#0A0F20', accent: '#E0272F', ink: '#0C0405', ok: '#3E5FBF', r: '6px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#E0272F', '#3E5FBF', '#2E2E38', '#C9A227'],
    heat: ['#0A0F20', 'rgba(224,39,47,.24)', 'rgba(224,39,47,.45)', 'rgba(224,39,47,.7)', '#E0272F'],
    bgArt: 'web-lines',
  },
  hulk: {
    id: 'hulk',
    label: 'Hulk',
    bg: '#0C140C', panel: '#101B10', line: '#1E301E', hover: '#162616', line2: '#2C4A2C',
    fg: '#DCEBDC', fgs: '#EFFAEF', dim: '#8FAE8F', dim2: '#729072', faint: '#4C664C', faint2: '#2E402E',
    track: '#0E1A0E', accent: '#4EA83E', ink: '#081208', ok: '#8B6BC9', r: '3px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#4EA83E', '#8B6BC9', '#A63A3A', '#6B6B4C'],
    heat: ['#0E1A0E', 'rgba(78,168,62,.24)', 'rgba(78,168,62,.45)', 'rgba(78,168,62,.7)', '#4EA83E'],
    bgArt: 'rage-cracks',
  },
  cap: {
    id: 'cap',
    label: 'Captain America',
    bg: '#F1F4F8', panel: '#FAFCFE', line: '#DCE3ED', hover: '#EDF1F7', line2: '#C7D2E2',
    fg: '#1B2740', fgs: '#0B1220', dim: '#4E5E7C', dim2: '#63718F', faint: '#8B9AB8', faint2: '#B9C4D8',
    track: '#E4EAF2', accent: '#C0202E', ink: '#FFFFFF', ok: '#2E5CA6', r: '4px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#C0202E', '#2E5CA6', '#B8942E', '#4E5E7C'],
    heat: ['#E4EAF2', 'rgba(192,32,46,.2)', 'rgba(192,32,46,.4)', 'rgba(192,32,46,.65)', '#C0202E'],
    bgArt: 'shield-rings',
  },
  gotham: {
    id: 'gotham',
    label: 'Gotham',
    bg: '#060608', panel: '#0A0A0D', line: '#18181E', hover: '#0F0F13', line2: '#26262E',
    fg: '#D6D6E0', fgs: '#F0F0F8', dim: '#838396', dim2: '#68687A', faint: '#454552', faint2: '#2A2A34',
    track: '#08080A', accent: '#E8C23E', ink: '#0A0800', ok: '#4E7AA8', r: '2px',
    fd: '"IBM Plex Sans", system-ui, sans-serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#E8C23E', '#4E7AA8', '#6B6B76', '#8A3A3A'],
    heat: ['#08080A', 'rgba(232,194,62,.2)', 'rgba(232,194,62,.4)', 'rgba(232,194,62,.65)', '#E8C23E'],
    bgArt: 'skyline-noir',
  },
  venom: {
    id: 'venom',
    label: 'Venom',
    bg: '#050505', panel: '#0A0A0A', line: '#1C1C1C', hover: '#121212', line2: '#2E2E2E',
    fg: '#E8E8E8', fgs: '#FFFFFF', dim: '#8F8F8F', dim2: '#707070', faint: '#484848', faint2: '#2A2A2A',
    track: '#080808', accent: '#3EE0C4', ink: '#02100C', ok: '#B8E83E', r: '3px',
    fd: '"IBM Plex Mono", monospace', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#3EE0C4', '#B8E83E', '#8A8A94', '#E8E8E8'],
    heat: ['#080808', 'rgba(62,224,196,.22)', 'rgba(62,224,196,.42)', 'rgba(62,224,196,.68)', '#3EE0C4'],
    bgArt: 'toxic-glow',
  },
  thanos: {
    id: 'thanos',
    label: 'Thanos',
    bg: '#12081C', panel: '#170B24', line: '#2A1640', hover: '#1D0F30', line2: '#3D2158',
    fg: '#E4D8F0', fgs: '#F5EEFC', dim: '#9C87B8', dim2: '#7E6B98', faint: '#544468', faint2: '#332844',
    track: '#150A20', accent: '#C9A227', ink: '#140A02', ok: '#8B4EC9', r: '8px',
    fd: 'Newsreader, Georgia, serif', fu: '"IBM Plex Sans", system-ui, sans-serif', fm: '"IBM Plex Mono", monospace',
    tags: ['#C9A227', '#8B4EC9', '#4E86C9', '#4EA83E'],
    heat: ['#150A20', 'rgba(201,162,39,.24)', 'rgba(201,162,39,.45)', 'rgba(201,162,39,.7)', '#C9A227'],
    bgArt: 'gem-sparkle',
  },
}

export const THEME_ORDER: ThemeId[] = [
  'night',
  'paper',
  'studio',
  'terminal',
  'tokyo',
  'kyoto',
  'nordic',
  'sahara',
  'amalfi',
  'marrakech',
  'matrix',
  'nebula',
  'wes',
  'jazz',
  'wolverine',
  'ironman',
  'spiderman',
  'hulk',
  'cap',
  'gotham',
  'venom',
  'thanos',
]

export function tagColor(theme: Theme, name: string, tags: Tag[]): string {
  const tag = tags.find((t) => t.name === name)
  const i = tag ? tag.colorIndex % theme.tags.length : 0
  return theme.tags[i]
}

// Categories (People/Things) carry their colorIndex directly, unlike Tags
// which are looked up by name off a Task — no lookup needed.
export function categoryColor(theme: Theme, colorIndex: number): string {
  return theme.tags[colorIndex % theme.tags.length]
}

export function heatColor(theme: Theme, minutes: number): string {
  const h = theme.heat
  if (!minutes) return h[0]
  if (minutes < 40) return h[1]
  if (minutes < 80) return h[2]
  if (minutes < 130) return h[3]
  return h[4]
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.style.setProperty('--bg', theme.bg)
  root.style.setProperty('--panel', theme.panel)
  root.style.setProperty('--line', theme.line)
  root.style.setProperty('--hover', theme.hover)
  root.style.setProperty('--line2', theme.line2)
  root.style.setProperty('--fg', theme.fg)
  root.style.setProperty('--fgs', theme.fgs)
  root.style.setProperty('--dim', theme.dim)
  root.style.setProperty('--dim2', theme.dim2)
  root.style.setProperty('--faint', theme.faint)
  root.style.setProperty('--faint2', theme.faint2)
  root.style.setProperty('--track', theme.track)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--ink', theme.ink)
  root.style.setProperty('--ok', theme.ok)
  root.style.setProperty('--r', theme.r)
  root.style.setProperty('--fd', theme.fd)
  root.style.setProperty('--fu', theme.fu)
  root.style.setProperty('--fm', theme.fm)
  root.setAttribute('data-theme', theme.id)
}
