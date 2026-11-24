// A rainy night seen through a window, built once as one SVG string. The same
// seed gives the same glass every time, so nothing jumps across reloads.
//
// What makes it read as real:
// - Most water sits still: a dense scatter of beads of every size, from specks
//   to a few fat drops, so the glass looks misted and wet.
// - Every drop is a little lens: a dark rim, a body lit from below by the city
//   lights (light flips through a lens, so the bottom is the bright part), and
//   a small glint near the top.
// - Only a few drops slide, and never steadily. A drop gathers, stalls, lurches
//   down, wanders sideways, stalls again, and speeds up as it goes. It sheds a
//   broken trail of tiny beads that fades slowly, and shrinks as it sheds.
// - Behind the glass, the city is nothing but soft discs of warm and cool light.
//
// Only transform and opacity move, and nothing is filtered. The trail beads
// fade in coarse steps, so they repaint rarely. With reduced motion each
// sliding drop rests partway down its run, with the fresh part of its trail
// above it, and the lights hold still.

const WIDTH = 1600
const HEIGHT = 1000

// City lights behind the glass: [color, weight]. Mostly warm street and window
// light, some cool shop and screen light, a little red from signals and cars.
const LIGHT_COLORS = [
  ['#ffb46b', 9], // sodium amber
  ['#ffd59a', 6], // warm window
  ['#8fb8ff', 6], // cool blue
  ['#a8e0ff', 3], // pale cyan
  ['#ff7a6b', 2], // red
]
const CITY_LIGHTS = 52
const HIGH_LIGHTS = 10
const BREATHE_SECONDS = [23, 29, 37]

// Still water on the glass.
const SPECK_TILES = [
  { id: 'specksA', width: 331, height: 287, count: 150 },
  { id: 'specksB', width: 419, height: 373, count: 150 },
]
const SMALL_BEADS = 105 // unique small beads over the tiles, so no repeat shows
const MEDIUM_DROPS = 56
const LARGE_DROPS = 6

// Sliding drops: few at a time, as on a real window.
const SLIDERS = 13

// Trail beads fade in this many steps over a drop's cycle, and appear on a
// clock of this many ticks a second, so beads left close together share one
// group and one timer.
const FADE_STEPS = 12
const DELAY_STEPS = 5

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

// CSS cubic-bezier easing as a function of time, for placing trail beads
// exactly where the drop is when it leaves them.
function bezier(x1, y1, x2, y2) {
  const at = (a, b, s) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s

  return time => {
    let low = 0
    let high = 1

    for (let step = 0; step < 30; step += 1) {
      const middle = (low + high) / 2

      if (at(x1, x2, middle) < time) {
        low = middle
      } else {
        high = middle
      }
    }

    return at(y1, y2, (low + high) / 2)
  }
}

const EASES = {
  form: ['cubic-bezier(0.2,0.6,0.4,1)', bezier(0.2, 0.6, 0.4, 1)],
  slip: ['cubic-bezier(0.45,0,0.4,1)', bezier(0.45, 0, 0.4, 1)],
  exit: ['cubic-bezier(0.5,0,1,1)', bezier(0.5, 0, 1, 1)],
  hold: ['linear', time => time],
}

// One lens of water, at any size. `tone` is the light it picks up from behind.
function lens(cx, cy, r, tone, shape = 'round') {
  const x = fixed(cx)
  const y = fixed(cy)
  const body =
    shape === 'round'
      ? (fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${fixed2(r)}" fill="${fill}"${extra}/>`
      : (fill, extra = '') =>
          `<path transform="translate(${x} ${y}) scale(${fixed2(r)})" d="M0 -1.75C0.5 -1.45 1 -0.7 1 0.05A1 1 0 0 1 -1 0.05C-1 -0.7 -0.5 -1.45 0 -1.75Z" fill="${fill}"${extra}/>`
  const parts = [body(`url(#lens${tone})`)]

  if (r >= 1.6) {
    parts.push(body('url(#rim)'))
  }

  if (r >= 2.6) {
    parts.push(
      `<ellipse cx="${x}" cy="${fixed(cy + r * 0.56)}" rx="${fixed2(r * 0.52)}" ry="${fixed2(r * 0.2)}" fill="${tone === 'W' ? '#ffe7c4' : '#d6e8ff'}" opacity="0.28"/>`,
    )
  }

  if (r >= 1.3) {
    parts.push(
      `<ellipse cx="${fixed(cx - r * 0.32)}" cy="${fixed(cy - r * 0.42)}" rx="${fixed2(r * 0.2)}" ry="${fixed2(r * 0.14)}" fill="#ffffff" opacity="0.85"/>`,
    )
  }

  return parts.join('')
}

export function buildRainScene() {
  const next = random(20261124)
  const between = (low, high) => low + next() * (high - low)
  const tone = () => (next() < 0.6 ? 'W' : 'C')

  // Lean a spot toward the sides, away from the words in the middle.
  const sideX = () => {
    const side = next()

    return side < 0.5 ? Math.pow(side * 2, 1.25) * WIDTH * 0.5 : WIDTH - Math.pow((1 - side) * 2, 1.25) * WIDTH * 0.5
  }

  // City lights behind the glass ------------------------------------------

  const totalWeight = LIGHT_COLORS.reduce((sum, [, weight]) => sum + weight, 0)
  const lightColor = () => {
    let roll = next() * totalWeight

    for (let index = 0; index < LIGHT_COLORS.length; index += 1) {
      roll -= LIGHT_COLORS[index][1]
      if (roll <= 0) {
        return index
      }
    }

    return 0
  }

  // Lights near the middle are kept dimmer, since that is where the words sit.
  const centerDim = (x, y) => {
    const dx = (x - WIDTH / 2) / (WIDTH / 2)
    const dy = (y - HEIGHT / 2) / (HEIGHT / 2)

    return 0.55 + 0.45 * Math.min(1, Math.hypot(dx, dy * 1.3))
  }

  const lightGroups = BREATHE_SECONDS.map(() => [])
  const addLight = (x, y, radius, strength) => {
    lightGroups[Math.floor(next() * lightGroups.length)].push(
      `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(radius)}" fill="url(#bk${lightColor()})" opacity="${fixed2(strength * centerDim(x, y))}"/>`,
    )
  }

  for (let index = 0; index < CITY_LIGHTS; index += 1) {
    const y = 560 + ((next() + next() + next()) / 3 - 0.5) * 640
    const near = next()

    addLight(between(-40, WIDTH + 40), Math.min(HEIGHT + 30, y), 16 + near * near * 72, 0.12 + near * 0.22)
  }

  for (let index = 0; index < HIGH_LIGHTS; index += 1) {
    addLight(between(0, WIDTH), between(60, 360), between(8, 22), between(0.08, 0.16))
  }

  // Wide, faint glows: the haze of a lit city in the rain.
  const haze = []

  for (let index = 0; index < 5; index += 1) {
    haze.push(
      `<ellipse cx="${fixed(between(0, WIDTH))}" cy="${fixed(between(620, 960))}" rx="${fixed(between(260, 420))}" ry="${fixed(between(120, 200))}" fill="url(#haze${index % 3 === 2 ? 'C' : 'W'})" opacity="${fixed2(between(0.6, 1))}"/>`,
    )
  }

  const lights = lightGroups.map((items, index) => `<g class="breathe l${index}">${items.join('')}</g>`)

  // Still water ------------------------------------------------------------

  // Specks tile over the whole glass from two tiles of different sizes, so the
  // repeat never lines up. Each speck stays clear of its tile's edge.
  const tiles = SPECK_TILES.map(tile => {
    const specks = []

    for (let index = 0; index < tile.count; index += 1) {
      const r = 0.55 + Math.pow(next(), 2.2) * 1.6

      specks.push(
        `<circle cx="${fixed(between(2, tile.width - 2))}" cy="${fixed(between(2, tile.height - 2))}" r="${fixed2(r)}"/>`,
      )
    }

    return `<pattern id="${tile.id}" width="${tile.width}" height="${tile.height}" patternUnits="userSpaceOnUse"><g fill="url(#speck)">${specks.join('')}</g></pattern>`
  })

  const still = []

  for (let index = 0; index < SMALL_BEADS; index += 1) {
    still.push(lens(next() * WIDTH, next() * HEIGHT, 1.2 + Math.pow(next(), 1.6) * 2.2, tone()))
  }

  for (let index = 0; index < MEDIUM_DROPS; index += 1) {
    still.push(lens(next() * WIDTH, next() * HEIGHT, 3.4 + Math.pow(next(), 1.6) * 5.2, tone()))
  }

  for (let index = 0; index < LARGE_DROPS; index += 1) {
    still.push(lens(sideX(), between(40, HEIGHT - 40), between(10, 15), tone()))
  }

  // Sliding drops ----------------------------------------------------------

  const sliders = []
  const rules = []
  const delayClasses = new Set()

  for (let dropIndex = 0; dropIndex < SLIDERS; dropIndex += 1) {
    const x0 = sideX()
    const y0 = between(30, 420)
    const size = between(11, 14.5)
    const exits = next() < 0.75 // the rest stop partway and soak away
    const dropTone = tone()

    // Each segment runs from one state to the next over a span of time.
    const states = [{ time: 0, x: 0, y: 0, scale: 0.55, opacity: 0, ease: 'form' }]
    const beads = []
    let time = between(1.2, 2.2)
    let x = 0
    let y = 0
    let scale = 1
    let slips = 0

    states.push({ time, x, y, scale, opacity: 1, ease: 'hold' })
    time += between(1.5, 4.5)

    const maxSlips = exits ? 40 : 4 + Math.floor(next() * 4)

    for (;;) {
      const growth = 1 + slips * 0.12
      const toBottom = HEIGHT + 40 - y0 - y
      const last = exits && toBottom < 90 * growth
      const distance = last ? toBottom : between(22, 60) * growth
      const speed = between(70, 150) * growth * (last ? 1.5 : 1)
      const duration = distance / speed
      const dx = last ? between(-3, 3) : between(-1, 1) * Math.min(9, distance * 0.18)
      const ease = last ? 'exit' : 'slip'
      const from = { x, y, scale }

      // The last state before this slip holds until it starts.
      states.push({ time, x, y, scale, ease })

      const nextScale = scale * between(0.955, 0.985)
      const spacing = between(11, 21)
      const count = Math.floor(distance / spacing)

      for (let bead = 1; bead <= count; bead += 1) {
        // Not every bit of the path leaves water: the trail is broken.
        if (next() < 0.35) {
          continue
        }

        const local = Math.min(1, (bead - 0.5 + between(-0.3, 0.3)) / count)
        const progress = EASES[ease][1](local)

        beads.push({
          time: time + local * duration,
          x: from.x + dx * progress + between(-0.6, 0.6),
          y: from.y + distance * progress - size * scale * 0.6,
          r: size * scale * between(0.07, 0.17),
        })
      }

      // A faint wet streak along the slip, shown once the drop reaches its end.
      beads.push({
        time: time + duration,
        streak: `M${fixed(from.x)} ${fixed(from.y - size * scale * 0.4)}L${fixed(from.x + dx)} ${fixed(from.y + distance - size * nextScale * 1.3)}`,
        r: size * scale * 0.2,
      })

      time += duration
      x += dx
      y += distance
      scale = nextScale
      slips += 1

      if (last || slips >= maxSlips) {
        break
      }

      states.push({ time, x, y, scale, ease: 'hold' })
      time += between(0.25, 2.6) / growth
    }

    if (exits) {
      // Off the bottom: hide it there.
      states.push({ time, x, y, scale, opacity: 1, ease: 'hold' })
      states.push({ time: time + 0.05, x, y, scale, opacity: 0, ease: 'hold' })
      time += 0.05
    } else {
      // It stops, then soaks into the glass.
      states.push({ time, x, y, scale, opacity: 1, ease: 'hold' })
      time += between(1.5, 3.5)
      states.push({ time, x, y, scale: scale * 0.8, opacity: 0, ease: 'hold' })
    }

    const cycle = time + between(2, 7)
    states.push({ time: cycle, x, y, scale: states[states.length - 1].scale, opacity: 0, ease: 'hold' })

    const phase = next() * cycle
    const percent = at => `${String(Math.round((at / cycle) * 10000) / 100)}%`
    const transform = state => `translate(${fixed(state.x)}px,${fixed(state.y)}px) scale(${fixed2(state.scale)})`
    const frames = states.map(state => {
      const opacity = state.opacity === undefined ? '' : `opacity:${state.opacity};`

      const timing = state.ease === 'slip' || state.ease === 'hold' ? '' : `;animation-timing-function:${EASES[state.ease][0]}`

      // A hold keeps one place, so its easing does not matter: it takes the
      // slip easing set on the class.
      return `${percent(state.time)}{${opacity}transform:${transform(state)}${timing}}`
    })

    rules.push(`@keyframes s${dropIndex}{${frames.join('')}}`)
    rules.push(`.s${dropIndex}{animation-name:s${dropIndex};animation-iteration-count:infinite;animation-timing-function:${EASES.slip[0]};animation-duration:${fixed2(cycle)}s;animation-delay:-${fixed2(phase)}s}`)
    rules.push(`.k${dropIndex}{animation-duration:${fixed2(cycle)}s}`)

    // At rest it sits at a stall about halfway down its run.
    const holds = states.filter(state => state.ease === 'slip' || state.ease === 'exit')
    const rest = holds[Math.min(holds.length - 1, Math.floor(holds.length * between(0.4, 0.6)))] ?? states[1]

    // Trail beads and streaks, grouped by when they appear. A group's cycle starts as the
    // drop passes it; the delay is rounded later, never earlier, so a bead
    // never shows before its drop has been there.
    const groups = new Map()

    for (const bead of beads) {
      const offset = (((bead.time - phase) % cycle) + cycle) % cycle
      const steps = Math.max(0, Math.floor((cycle - offset) * DELAY_STEPS))
      const age = rest.time - bead.time
      const restOpacity = age >= 0 ? 0.85 * Math.max(0, 1 - age / cycle) : 0
      const group = groups.get(steps) ?? { steps, restOpacity, items: [] }

      group.items.push(
        bead.streak === undefined
          ? `<circle cx="${fixed(bead.x)}" cy="${fixed(bead.y)}" r="${fixed(bead.r)}"/>`
          : `<path class="w" d="${bead.streak}" stroke-width="${fixed(bead.r)}"/>`,
      )
      groups.set(steps, group)
    }

    const trail = [...groups.values()].map(group => {
      delayClasses.add(group.steps)

      return `<g class="t k${dropIndex} q${group.steps}" opacity="${fixed2(group.restOpacity)}" fill="url(#trail${dropTone})">${group.items.join('')}</g>`
    })

    sliders.push(
      `<g transform="translate(${fixed(x0)} ${fixed(y0)})">` +
        trail.join('') +
        `<g class="s${dropIndex}" transform="translate(${fixed(rest.x)} ${fixed(rest.y)}) scale(${fixed2(rest.scale)})">` +
        lens(0, 0, size, dropTone, 'tear') +
        '</g></g>',
    )
  }

  const delayRules = [...delayClasses].sort((a, b) => a - b).map(steps => `.q${steps}{animation-delay:-${steps / DELAY_STEPS}s}`)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">`,
    '<defs>',
    '<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#050a14"/>',
    '<stop offset="0.55" stop-color="#0a1424"/>',
    '<stop offset="1" stop-color="#0f1b2e"/>',
    '</linearGradient>',
    // Out-of-focus lights: an even disc that melts away at its edge.
    ...LIGHT_COLORS.map(
      ([hex], index) =>
        `<radialGradient id="bk${index}">` +
        `<stop offset="0" stop-color="${hex}" stop-opacity="0.5"/>` +
        `<stop offset="0.5" stop-color="${hex}" stop-opacity="0.52"/>` +
        `<stop offset="0.72" stop-color="${hex}" stop-opacity="0.42"/>` +
        `<stop offset="0.88" stop-color="${hex}" stop-opacity="0.15"/>` +
        `<stop offset="1" stop-color="${hex}" stop-opacity="0"/>` +
        '</radialGradient>',
    ),
    '<radialGradient id="hazeW">',
    '<stop offset="0" stop-color="#ffb46b" stop-opacity="0.08"/>',
    '<stop offset="0.5" stop-color="#ffb46b" stop-opacity="0.04"/>',
    '<stop offset="1" stop-color="#ffb46b" stop-opacity="0"/>',
    '</radialGradient>',
    '<radialGradient id="hazeC">',
    '<stop offset="0" stop-color="#8fb8ff" stop-opacity="0.07"/>',
    '<stop offset="0.5" stop-color="#8fb8ff" stop-opacity="0.035"/>',
    '<stop offset="1" stop-color="#8fb8ff" stop-opacity="0"/>',
    '</radialGradient>',
    '<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#9fb6d6" stop-opacity="0.05"/>',
    '<stop offset="0.4" stop-color="#9fb6d6" stop-opacity="0"/>',
    '<stop offset="0.8" stop-color="#9fb6d6" stop-opacity="0.03"/>',
    '<stop offset="1" stop-color="#9fb6d6" stop-opacity="0.08"/>',
    '</linearGradient>',
    // A lens body: dark above, lit from below by warm or cool city light.
    '<linearGradient id="lensW" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#0a1322" stop-opacity="0.6"/>',
    '<stop offset="0.45" stop-color="#2a3b57" stop-opacity="0.45"/>',
    '<stop offset="0.8" stop-color="#a8977f" stop-opacity="0.5"/>',
    '<stop offset="1" stop-color="#f6ddb4" stop-opacity="0.75"/>',
    '</linearGradient>',
    '<linearGradient id="lensC" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#0a1322" stop-opacity="0.6"/>',
    '<stop offset="0.45" stop-color="#284066" stop-opacity="0.45"/>',
    '<stop offset="0.8" stop-color="#7f9cc6" stop-opacity="0.5"/>',
    '<stop offset="1" stop-color="#d8e9ff" stop-opacity="0.75"/>',
    '</linearGradient>',
    // The dark rim where the lens bends the light away.
    '<radialGradient id="rim">',
    '<stop offset="0.7" stop-color="#02060e" stop-opacity="0"/>',
    '<stop offset="0.9" stop-color="#02060e" stop-opacity="0.35"/>',
    '<stop offset="1" stop-color="#02060e" stop-opacity="0.65"/>',
    '</radialGradient>',
    // A trail bead: a tiny lens, its lit foot taking the light behind.
    ...[['W', '#f1dcbc'], ['C', '#cfe2fb']].map(
      ([toneName, hex]) =>
        `<radialGradient id="trail${toneName}" cy="0.62">` +
        `<stop offset="0" stop-color="${hex}" stop-opacity="0.75"/>` +
        '<stop offset="0.6" stop-color="#6f88ad" stop-opacity="0.45"/>' +
        '<stop offset="1" stop-color="#02060e" stop-opacity="0.6"/>' +
        '</radialGradient>',
    ),
    // A speck: too small for a glint, just a dark edge and a pale middle.
    '<radialGradient id="speck" cy="0.6">',
    '<stop offset="0" stop-color="#c4d5ec" stop-opacity="0.45"/>',
    '<stop offset="0.6" stop-color="#5a729a" stop-opacity="0.3"/>',
    '<stop offset="1" stop-color="#02060e" stop-opacity="0.6"/>',
    '</radialGradient>',
    ...tiles,
    '</defs>',
    '<style>',
    '.breathe{animation-name:breathe;animation-timing-function:ease-in-out;animation-iteration-count:infinite}',
    '@keyframes breathe{0%,100%{opacity:1}50%{opacity:0.72}}',
    ...BREATHE_SECONDS.map((seconds, index) => `.l${index}{animation-duration:${seconds}s;animation-delay:-${index * 7}s}`),
    `.t{animation-name:trail;animation-iteration-count:infinite;animation-timing-function:steps(${FADE_STEPS},end)}`,
    '@keyframes trail{0%{opacity:0.85}100%{opacity:0}}',
    '.w{fill:none;stroke:#b4c9e6;stroke-opacity:0.14;stroke-linecap:round;stroke-dasharray:16 5 4 7 9 4}',
    ...rules,
    ...delayRules,
    '</style>',
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#night)"/>`,
    ...haze,
    ...lights,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#mist)"/>`,
    ...SPECK_TILES.map(tile => `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#${tile.id})"/>`),
    `<g>${still.join('')}</g>`,
    ...sliders,
    '</svg>',
  ].join('')
}
