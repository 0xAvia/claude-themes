import type { ThemeDef } from './types'

// A stand-in until a theme's own file is written: a plain dark look, no motion.
// Each theme file replaces its call to this with its real definition.
export function placeholder(id: string, label: string): ThemeDef {
  return {
    id,
    label: `${label} (not built yet)`,
    colors: {
      label,
      only: 'dark',
      roles: { accent: '#8a9bb8', danger: '#e5484d', success: '#4cc38a', warning: '#f0b429', pro: '#b48cf2' },
      dark: {
        gray: {
          anchors: {
            'surface-0': '#0b0b0e',
            'surface-1': '#111115',
            'surface-2': '#16161b',
            'surface-3': '#1b1b21',
            'text-primary': '#ececf2',
            'text-secondary': '#c4c4d0',
            'text-muted': '#9d9dac',
          },
        },
      },
    },
    glass: false,
    scene: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10" preserveAspectRatio="xMidYMid slice"><rect width="16" height="10" fill="#0b0b0e"/></svg>',
    sceneAlt: 'A plain dark background',
  }
}
