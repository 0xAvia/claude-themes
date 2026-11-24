import type { ThemeBackdropGlass, ThemeStyle } from 'claude-code'

import type { makeColors } from '../make-colors.js'

/**
 * One theme of the mod. Each lives in its own file under hooks/themes/ and is
 * listed in hooks/themes/index.ts; `/skin <id>` switches to it.
 */
export type ThemeDef = {
  /** What `/skin <id>` takes, and the backdrop's scene name: letters, digits, `-`. */
  id: string
  /** Shown by `/skin` when it lists the themes. */
  label: string
  /** What `makeColors` is given; use `only: 'dark'` for a dark-only look. */
  colors: Parameters<typeof makeColors>[0]
  /** How the app frosts its panels over the backdrop, or `false` for none. */
  glass: ThemeBackdropGlass | false
  /** The backdrop: one pure-vector SVG document, animated with its own CSS. */
  scene: string
  /** What the backdrop shows, for a reader that cannot see it. */
  sceneAlt: string
  /** Optional restyling of messages and tool rows (see ThemeStyle). */
  style?: ThemeStyle
}
