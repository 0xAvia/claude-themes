import { grapeNight } from './grape-night'
import { rainWindow } from './rain-window'
import { starryNight } from './starry-night'
import type { ThemeDef } from './types'
import { voidTheme } from './void'

/** Every theme `/skin` can switch to. The first is the default. */
export const THEMES: readonly ThemeDef[] = [starryNight, voidTheme, grapeNight, rainWindow]
