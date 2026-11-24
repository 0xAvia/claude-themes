// The void, built once as one SVG string: a slow flight forward through
// black space. Stars come out of the dark near the middle and spread toward
// the edges, growing as they near, like moving through a still starfield.
//
// The stars are split into waves. Each wave is one group that scales up from
// the center and fades in, then out, on the same long clock, staggered so a
// new wave is always arriving. Only transform and opacity animate. With
// reduced motion each wave rests at its plain size and opacity, which is a
// finished starfield on its own.

const WIDTH = 1600
const HEIGHT = 1000
const CX = WIDTH / 2
const CY = HEIGHT / 2

// Far enough to reach the corners of the widest window.
const REACH = 960

const WAVES = 8
const STARS_PER_WAVE = 62
const SECONDS = 96

// A faint, still layer of the farthest stars, for depth behind the waves.
const DUST = 170

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

export function buildVoidScene() {
  const next = random(20261124)
  const grays = ['#ffffff', '#f2f2f2', '#e0e0e0', '#cfcfcf']
  const gray = () => grays[Math.floor(next() * grays.length)]

  const dust = []

  for (let index = 0; index < DUST; index += 1) {
    dust.push(
      `<circle cx="${fixed(next() * WIDTH)}" cy="${fixed(next() * HEIGHT)}" r="${fixed2(0.3 + next() * 0.3)}" fill="#ffffff" opacity="${fixed2(0.12 + next() * 0.2)}"/>`,
    )
  }

  const waves = []
  const rules = []

  for (let wave = 0; wave < WAVES; wave += 1) {
    const stars = [
      // An empty frame centered on the origin, so the group's box is centered
      // on the middle of the screen and it scales out from there.
      `<rect x="${-REACH}" y="${-REACH}" width="${REACH * 2}" height="${REACH * 2}" fill="none"/>`,
    ]

    for (let index = 0; index < STARS_PER_WAVE; index += 1) {
      // Even over the area, but none right at the middle, where the words sit.
      const distance = 60 + Math.sqrt(next()) * (REACH - 60)
      const angle = next() * Math.PI * 2
      const brightness = Math.pow(next(), 2.2)

      stars.push(
        `<circle cx="${fixed(Math.cos(angle) * distance)}" cy="${fixed(Math.sin(angle) * distance)}" r="${fixed2(0.4 + brightness * 0.75)}" fill="${gray()}" opacity="${fixed2(0.35 + brightness * 0.6)}"/>`,
      )
    }

    // At rest (reduced motion), the waves sit at their plain size, some dimmer.
    waves.push(`<g class="wave w${wave}" opacity="${fixed2(0.55 + (wave % 3) * 0.2)}">${stars.join('')}</g>`)
    rules.push(`.w${wave}{animation-delay:-${fixed((SECONDS / WAVES) * wave)}s}`)
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">`,
    '<style>',
    `.wave{transform-box:fill-box;transform-origin:50% 50%;animation:fly ${SECONDS}s cubic-bezier(0.55,0,0.9,0.6) infinite}`,
    '@keyframes fly{0%{transform:scale(0.28);opacity:0}14%{opacity:1}82%{opacity:1}100%{transform:scale(2.3);opacity:0}}',
    ...rules,
    '</style>',
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="#000000"/>`,
    `<g>${dust.join('')}</g>`,
    `<g transform="translate(${CX} ${CY})">${waves.join('')}</g>`,
    '</svg>',
  ].join('')
}
