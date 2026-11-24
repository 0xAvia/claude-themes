import type { ThemeDef } from './types'

// Grape night: purple-black panels with a grape accent, over a backdrop of a
// few big soft orbs of light drifting very slowly.
//
// The softness comes from radial gradients that fade to nothing, not from a
// blur filter, so nothing heavy is redrawn each frame. Each orb drifts on its
// own long clock (translate only), so they never line up the same way twice.

const WIDTH = 1600
const HEIGHT = 1000
const GROUND = '#0d0812'

type Orb = {
  /** Resting center and radius, in viewBox units. */
  x: number
  y: number
  r: number
  color: string
  /** Peak opacity at the orb's heart. */
  strength: number
  /** One full drift there and back, in seconds. */
  seconds: number
  /** Two waypoints of the drift, as offsets from rest. */
  path: [[number, number], [number, number]]
}

// Kept to the edges and corners, so the middle, where the words sit, stays darkest.
const ORBS: Orb[] = [
  // Grape, upper left.
  { x: 280, y: 220, r: 560, color: '#9b5de5', strength: 0.34, seconds: 58, path: [[150, 90], [60, 170]] },
  // Deep violet, lower right, the largest.
  { x: 1340, y: 820, r: 660, color: '#5b2fb8', strength: 0.4, seconds: 83, path: [[-170, -80], [-60, -150]] },
  // Plum-berry, upper right, smaller.
  { x: 1260, y: 140, r: 400, color: '#b24fa6', strength: 0.22, seconds: 47, path: [[-110, 110], [-190, 40]] },
]

// A smooth fall-off from the heart to the rim, in enough stops that the dark
// ground shows no bands.
const FALLOFF = [
  [0, 1],
  [0.15, 0.9],
  [0.3, 0.7],
  [0.45, 0.48],
  [0.6, 0.28],
  [0.75, 0.13],
  [0.88, 0.04],
  [1, 0],
] as const

const round = (value: number) => String(Math.round(value * 1000) / 1000)

function buildGrapeScene(): string {
  const gradients = ORBS.map(
    (orb, index) =>
      `<radialGradient id="orb${index}">` +
      FALLOFF.map(
        ([offset, share]) =>
          `<stop offset="${offset}" stop-color="${orb.color}" stop-opacity="${round(orb.strength * share)}"/>`,
      ).join('') +
      '</radialGradient>',
  )

  const keyframes = ORBS.map((orb, index) => {
    const [[ax, ay], [bx, by]] = orb.path

    return (
      `@keyframes drift${index}{` +
      '0%,100%{transform:translate(0px,0px)}' +
      `35%{transform:translate(${ax}px,${ay}px)}` +
      `70%{transform:translate(${bx}px,${by}px)}}` +
      `.o${index}{animation:drift${index} ${orb.seconds}s ease-in-out infinite;animation-delay:-${Math.round(orb.seconds * index * 0.3)}s}`
    )
  })

  const orbs = ORBS.map(
    (orb, index) =>
      `<g class="orb o${index}"><circle cx="${orb.x}" cy="${orb.y}" r="${orb.r}" fill="url(#orb${index})"/></g>`,
  )

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">`,
    '<defs>',
    // The ground: a touch lighter at the top than the foot.
    '<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#120a1a"/>',
    `<stop offset="1" stop-color="${GROUND}"/>`,
    '</linearGradient>',
    ...gradients,
    // A soft dark pool in the middle, so text over it keeps its contrast.
    '<radialGradient id="hush" cx="0.5" cy="0.52" r="0.5">',
    `<stop offset="0" stop-color="${GROUND}" stop-opacity="0.55"/>`,
    `<stop offset="0.5" stop-color="${GROUND}" stop-opacity="0.35"/>`,
    `<stop offset="1" stop-color="${GROUND}" stop-opacity="0"/>`,
    '</radialGradient>',
    '</defs>',
    '<style>',
    '.orb{will-change:transform}',
    ...keyframes,
    '@media (prefers-reduced-motion: reduce){.orb{animation:none}}',
    '</style>',
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ground)"/>`,
    ...orbs,
    `<rect x="-200" y="-150" width="${WIDTH + 400}" height="${HEIGHT + 300}" fill="url(#hush)"/>`,
    '</svg>',
  ].join('')
}

export const grapeNight: ThemeDef = {
  id: 'grape-night',
  label: 'Grape night: purple-black, grape accent, slow soft orbs of light',
  colors: {
    label: 'Grape night',
    only: 'dark',
    roles: { accent: '#9b5de5', danger: '#e5546b', success: '#4fc79a', warning: '#f0b44c', pro: '#d17ee0' },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#0d0812',
          'surface-1': '#120c19',
          'surface-2': '#17101f',
          'surface-3': '#1c1426',
          'text-primary': '#efe8f7',
          'text-secondary': '#cbbfdb',
          'text-muted': '#a596b8',
        },
      },
    },
  },
  // A moderate purple frost: the orbs glow through the panels without crowding the words.
  glass: { blur: 8, tint: '#0d0812', opacity: 0.55 },
  scene: buildGrapeScene(),
  sceneAlt: 'A deep purple-black sky with a few large, soft orbs of grape and violet light drifting slowly',
}
