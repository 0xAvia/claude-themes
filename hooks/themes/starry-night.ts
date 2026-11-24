import { buildScene } from '../scene.js'
import type { ThemeDef } from './types'

// Deep space: black panels with the faintest cool tint, so the stars carry the color.
export const starryNight: ThemeDef = {
  id: 'starry-night',
  label: 'Starry night: black space, realistic stars, shooting stars',
  colors: {
    label: 'Starry night',
    only: 'dark',
    roles: { accent: '#7c9cff', danger: '#e5484d', success: '#4cc38a', warning: '#f0b429', pro: '#b48cf2' },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#000000',
          'surface-1': '#07070a',
          'surface-2': '#0c0c11',
          'surface-3': '#121218',
          'text-primary': '#ececf2',
          'text-secondary': '#c4c4d0',
          'text-muted': '#9d9dac',
        },
      },
    },
  },
  // A light frost, so the stars still show through the app's panels.
  glass: { blur: 2, tint: '#000000', opacity: 0.45 },
  scene: buildScene(),
  sceneAlt: 'A night sky of twinkling stars, with a shooting star now and then',
}
