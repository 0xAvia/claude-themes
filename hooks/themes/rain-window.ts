import { buildRainScene } from './rain-window-scene.js'
import type { ThemeDef } from './types'

// A rainy night through a window: navy panels, cool white words, and a heavy
// frost on every panel so it reads as wet glass over the city lights.
export const rainWindow: ThemeDef = {
  id: 'rain-window',
  label: 'Rain window: dark navy, raindrops sliding down, frosted wet glass',
  colors: {
    label: 'Rain window',
    only: 'dark',
    roles: { accent: '#6fa8ff', danger: '#e5534b', success: '#4cc38a', warning: '#e8b04b', pro: '#a98bf0' },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#0a1220',
          'surface-1': '#0e1828',
          'surface-2': '#121d2f',
          'surface-3': '#162134',
          'text-primary': '#e8eef8',
          'text-secondary': '#bfcbdc',
          'text-muted': '#97a6bb',
        },
      },
    },
  },
  // A strong frost with a navy veil: the lights and drops blur to soft shapes
  // behind the panels, and the words keep a dark, even ground.
  glass: { blur: 22, tint: '#0a1220', opacity: 0.62 },
  scene: buildRainScene(),
  sceneAlt: 'Raindrops sliding slowly down a night window, with soft blurred city lights behind',
}
