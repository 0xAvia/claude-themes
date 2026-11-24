// Deep space, built once as one SVG string. The same seed gives the same
// sky every time, so the stars stay put across reloads.
//
// What makes it read as real: most stars are tiny and faint and only a few
// are bright; colors follow star temperature (blue-white to orange); stars
// crowd along a faint band like the Milky Way; and the twinkle is gentle.

const WIDTH = 1600
const HEIGHT = 1000

// Star colors by temperature, weighted by how common they look to the eye.
const STAR_COLORS = [
  ['#9bb0ff', 4], // hot blue
  ['#aabfff', 6],
  ['#cad7ff', 10], // blue-white
  ['#f8f7ff', 26], // white
  ['#fff4ea', 24], // yellow-white, like the sun
  ['#ffe9d0', 14],
  ['#ffd2a1', 10], // orange
  ['#ffc58a', 6], // red-orange
]

const FIELD_STARS = 560 // spread over the whole sky
const BAND_STARS = 420 // crowded along the band
const BRIGHT_STARS = 9 // the few that stand out, with a soft glow
const SPIKED_STARS = 3 // the brightest, with faint four-point spikes

// The band crosses from lower left to upper right.
const BAND = { x1: -100, y1: 1000, x2: 1700, y2: 80, spread: 120 }

// Twinkling stars are split into groups, each on its own slow clock, so the
// sky never pulses together. Dips are shallow, as real twinkle is.
const TWINKLE_GROUPS = [3.1, 3.7, 4.3, 4.9, 5.6, 6.2, 6.9, 7.7]
const STARS_PER_GROUP = 14

// Each shooting star: where it starts, the way it falls (degrees, 0 is right),
// how often it comes round, how long before its first pass, and its tail.
const SHOOTING_STARS = [
  { x: 150, y: 150, angle: 21, seconds: 13, delay: 3, length: 120 },
  { x: 1470, y: 100, angle: 159, seconds: 19, delay: 9, length: 150 },
  { x: 960, y: 40, angle: 31, seconds: 31, delay: 16, length: 100 },
]

function random(seed) {
  let state = seed

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const fixed = value => String(Math.round(value * 10) / 10)
const fixed2 = value => String(Math.round(value * 100) / 100)

export function buildScene() {
  const next = random(20261122)
  const total = STAR_COLORS.reduce((sum, [, weight]) => sum + weight, 0)

  const color = () => {
    let roll = next() * total

    for (const [hex, weight] of STAR_COLORS) {
      roll -= weight
      if (roll <= 0) {
        return hex
      }
    }

    return '#f8f7ff'
  }

  // A rough bell curve, for the band's spread.
  const gauss = () => (next() + next() + next() + next() - 2) / 2

  const fieldPoint = () => [next() * WIDTH, next() * HEIGHT]

  const bandPoint = () => {
    const along = next()
    const dx = BAND.x2 - BAND.x1
    const dy = BAND.y2 - BAND.y1
    const length = Math.hypot(dx, dy)
    const offset = gauss() * BAND.spread

    return [BAND.x1 + dx * along - (dy / length) * offset, BAND.y1 + dy * along + (dx / length) * offset]
  }

  // Most stars are faint: brightness is skewed hard toward zero.
  const faint = ([x, y], dimmer) => {
    const brightness = Math.pow(next(), 2.6) * dimmer
    const radius = 0.35 + brightness * 0.75
    const opacity = 0.18 + brightness * 0.6

    return `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed2(radius)}" fill="${color()}" opacity="${fixed2(opacity)}"/>`
  }

  const still = []

  for (let index = 0; index < FIELD_STARS; index += 1) {
    still.push(faint(fieldPoint(), 1))
  }

  for (let index = 0; index < BAND_STARS; index += 1) {
    still.push(faint(bandPoint(), 0.7))
  }

  const twinkling = TWINKLE_GROUPS.map((seconds, groupIndex) => {
    const stars = []

    for (let index = 0; index < STARS_PER_GROUP; index += 1) {
      const [x, y] = next() < 0.4 ? bandPoint() : fieldPoint()

      stars.push(
        `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed2(0.6 + next() * 0.5)}" fill="${color()}"/>`,
      )
    }

    return `<g class="twinkle t${groupIndex}">${stars.join('')}</g>`
  })

  const bright = []

  for (let index = 0; index < BRIGHT_STARS; index += 1) {
    const x = fixed(60 + next() * (WIDTH - 120))
    const y = fixed(60 + next() * (HEIGHT - 120))
    const hex = color()
    const radius = 1.2 + next() * 0.7
    const parts = [
      `<circle cx="${x}" cy="${y}" r="${fixed(radius * 5)}" fill="url(#glow)" opacity="0.45"/>`,
      `<circle cx="${x}" cy="${y}" r="${fixed2(radius)}" fill="${hex}"/>`,
      `<circle cx="${x}" cy="${y}" r="${fixed2(radius * 0.45)}" fill="#ffffff"/>`,
    ]

    if (index < SPIKED_STARS) {
      const spike = fixed(14 + next() * 10)

      parts.push(
        `<rect x="${fixed(Number(x) - Number(spike))}" y="${fixed(Number(y) - 0.35)}" width="${fixed(Number(spike) * 2)}" height="0.7" fill="url(#spikeH)"/>`,
        `<rect x="${fixed(Number(x) - 0.35)}" y="${fixed(Number(y) - Number(spike))}" width="0.7" height="${fixed(Number(spike) * 2)}" fill="url(#spikeV)"/>`,
      )
    }

    bright.push(`<g class="twinkle b${index}">${parts.join('')}</g>`)
  }

  const shooting = SHOOTING_STARS.map(
    (item, index) =>
      `<g transform="translate(${item.x} ${item.y}) rotate(${item.angle})">` +
      `<g class="shoot s${index}" opacity="0">` +
      `<path d="M${-item.length} 0L0 -0.8L0 0.8Z" fill="url(#tail)"/>` +
      `<circle r="3" fill="url(#glow)" opacity="0.5"/>` +
      `<circle r="1.1" fill="#ffffff"/>` +
      `</g></g>`,
  )

  const twinkleRules = TWINKLE_GROUPS.map(
    (seconds, index) => `.t${index}{animation-duration:${seconds}s;animation-delay:-${fixed(index * 0.9)}s}`,
  )
  const brightRules = Array.from(
    { length: BRIGHT_STARS },
    (_, index) => `.b${index}{animation-duration:${fixed(5.5 + index * 0.8)}s;animation-delay:-${fixed(index * 1.3)}s}`,
  )
  const shootRules = SHOOTING_STARS.map(
    (item, index) => `.s${index}{animation-duration:${item.seconds}s;animation-delay:${item.delay}s}`,
  )

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">`,
    '<defs>',
    '<radialGradient id="glow">',
    '<stop offset="0" stop-color="#e8eeff" stop-opacity="0.8"/>',
    '<stop offset="0.35" stop-color="#e8eeff" stop-opacity="0.2"/>',
    '<stop offset="1" stop-color="#e8eeff" stop-opacity="0"/>',
    '</radialGradient>',
    '<linearGradient id="spikeH" x1="0" y1="0" x2="1" y2="0">',
    '<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>',
    '<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.7"/>',
    '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>',
    '</linearGradient>',
    '<linearGradient id="spikeV" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>',
    '<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.7"/>',
    '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>',
    '</linearGradient>',
    '<linearGradient id="tail" x1="0" y1="0" x2="1" y2="0">',
    '<stop offset="0" stop-color="#d6e0ff" stop-opacity="0"/>',
    '<stop offset="1" stop-color="#ffffff" stop-opacity="0.9"/>',
    '</linearGradient>',
    '</defs>',
    '<style>',
    '.twinkle{animation-name:twinkle;animation-timing-function:ease-in-out;animation-iteration-count:infinite}',
    '@keyframes twinkle{0%,100%{opacity:1}30%{opacity:0.7}55%{opacity:0.95}75%{opacity:0.55}}',
    '.shoot{animation-name:shoot;animation-timing-function:cubic-bezier(0.2,0.6,0.4,1);animation-iteration-count:infinite;animation-fill-mode:backwards}',
    '@keyframes shoot{0%{opacity:0;transform:translateX(0)}1%{opacity:1}4%{opacity:0.8}6%{opacity:0;transform:translateX(620px)}100%{opacity:0;transform:translateX(620px)}}',
    ...twinkleRules,
    ...brightRules,
    ...shootRules,
    '</style>',
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="#000000"/>`,
    `<g>${still.join('')}</g>`,
    ...twinkling,
    ...bright,
    ...shooting,
    '</svg>',
  ].join('')
}
