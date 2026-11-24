import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { THEMES } from './themes/index'
import type { ThemeDef } from './themes/types'

const PLUGIN = 'starry-night'
const COMMAND = 'skin'
const STORE_KEY = 'theme'

const DEFAULT = THEMES[0] as ThemeDef

const find = (id: string): ThemeDef | undefined => THEMES.find(theme => theme.id === id)

const listing = (current: string) =>
  THEMES.map(
    theme => `- \`/${COMMAND} ${theme.id}\`: ${theme.label}${theme.id === current ? ' **(current)**' : ''}`,
  ).join('\n')

// Sets the whole look for one theme. Falls back to the look without `style`
// on a build that doesn't take it.
async function apply($: EngineInterface, theme: ThemeDef) {
  const { theme: colors, problems } = makeColors(theme.colors)
  const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    $.ui.toast(`${theme.id}: ${unpainted}`)
  }

  const look: ThemeSetArgs = { colors, backdrop: { scene: theme.id, glass: theme.glass } }

  if (theme.style !== undefined) {
    try {
      return await $.theme.set({ ...look, style: theme.style })
    } catch (error) {
      $.ui.log(String(error))
    }
  }

  return $.theme.set(look)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'skin',
      description: `Switch theme: ${THEMES.map(theme => theme.id).join(', ')}`,
    })

    const saved = await $.store.get(STORE_KEY)
    const theme = (typeof saved === 'string' ? find(saved) : undefined) ?? DEFAULT
    const set = await apply($, theme)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  // `/skin` lists the themes; `/skin <id>` switches and remembers the choice.
  on('command.run', { command: 'skin' }, async ($, e) => {
    const wanted = e.args.trim().toLowerCase()
    const saved = await $.store.get(STORE_KEY)
    const current = typeof saved === 'string' && find(saved) !== undefined ? saved : DEFAULT.id

    if (wanted === '') {
      return { text: `Themes:\n\n${listing(current)}` }
    }

    const theme = find(wanted)

    if (theme === undefined) {
      return { text: `No theme called "${wanted}". Themes:\n\n${listing(current)}` }
    }

    await $.store.set(STORE_KEY, theme.id)
    const set = await apply($, theme)

    return { text: set.isDrawn ? `Theme set to ${theme.id}.` : `Theme set to ${theme.id}, but it isn't drawn here: ${set.reason}` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== PLUGIN) {
      return next(e)
    }

    const theme = find(e.props.scene)

    if (theme === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg source={theme.scene} alt={theme.sceneAlt} isInteractive />
  })
}
