import type { ThemeMessageRule } from 'claude-code'

import type { ThemeDef } from './types'
import { buildVoidScene } from './void-scene.js'

// Pure black and white: grays with no hue at all, so it is truly monochrome.
// Messages sit on solid black, so the stars never pass under the words. Only
// the person's own messages are outlined, in a thin white line.
const box: ThemeMessageRule = {
  backgroundColor: '#000000',
  color: '#f5f5f5',
  radius: 8,
  paddingX: 14,
  paddingY: 10,
  shadow: 'none',
}

export const voidTheme: ThemeDef = {
  id: 'void',
  label: 'Void: pure black, monochrome, a slow flight forward through the stars',
  colors: {
    label: 'Void',
    only: 'dark',
    contrast: 'more',
    roles: {
      // White accent: near-white links, keywords and accent borders (stops 250
      // and 300). Filled controls take silver (stop 400) instead of white, so a
      // switch's white knob still shows at 3:1 on its track when it is on.
      accent: {
        seed: '#ffffff',
        fillShade: 400,
        stops: { 50: '#f5f5f5', 100: '#ebebeb', 250: '#e2e2e2', 300: '#dadada', 400: '#939393' },
      },
      // Meaning stays: red, green and amber, kept soft beside the white.
      danger: '#e5484d',
      success: '#4cc38a',
      warning: '#f0b429',
      pro: '#b8b8b8',
    },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#000000',
          'surface-1': '#060606',
          'surface-2': '#0b0b0b',
          'surface-3': '#121212',
          'text-primary': '#f5f5f5',
          'text-secondary': '#cccccc',
          'text-muted': '#a6a6a6',
        },
      },
    },
  },
  // No blur, so the app never re-blurs the moving stars: a plain black veil.
  glass: { blur: 0, tint: '#000000', opacity: 0.55 },
  scene: buildVoidScene(),
  sceneAlt: 'A pure black void, flying slowly forward as white stars spread out from the middle',
  style: {
    UserMessage: { ...box, borderColor: '#ffffff', borderWidth: 1 },
    AssistantMessage: { ...box, paddingX: 4, paddingY: 4 },
    ToolUse: { backgroundColor: '#000000', color: '#d6d6d6', radius: 4, paddingX: 6, paddingY: 2 },
  },
}
