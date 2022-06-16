import { isNullOrUndefined } from '@standardnotes/snjs'
import { Platform, ScaledSize } from 'react-native'
import { DefaultTheme } from 'styled-components/native'
import { MobileTheme } from './MobileTheme'
/* eslint-disable no-bitwise */
export const LIGHT_MODE_KEY = 'light'
export const DARK_MODE_KEY = 'dark'
export const LIGHT_CONTENT = 'light-content'
export const DARK_CONTENT = 'dark-content'

export const getDefaultDrawerWidth = ({ height, width }: ScaledSize) => {
  /*
   * Default drawer width is screen width - header height
   * with a max width of 280 on mobile and 320 on tablet
   * https://material.io/guidelines/patterns/navigation-drawer.html
   */
  const smallerAxisSize = Math.min(height, width)
  const isLandscape = width > height
  const isTablet = smallerAxisSize >= 600
  const appBarHeight = Platform.OS === 'ios' ? (isLandscape ? 32 : 44) : 56
  const maxWidth = isTablet ? 320 : 280

  return Math.min(smallerAxisSize - appBarHeight, maxWidth)
}

export function statusBarColorForTheme(theme: MobileTheme) {
  if (isNullOrUndefined(theme.mobileContent.luminosity)) {
    throw Error('Theme luminocity should not be null')
  }
  // The main nav bar uses contrast background color
  if (theme.mobileContent.luminosity < 130) {
    // is dark color, return white status bar
    return LIGHT_CONTENT
  } else {
    return DARK_CONTENT
  }
}

export function keyboardColorForTheme(theme: MobileTheme) {
  if (isNullOrUndefined(theme.mobileContent.luminosity)) {
    throw Error('Theme luminocity should not be null')
  }
  if (theme.mobileContent.luminosity < 130) {
    // is dark color, return dark keyboard
    return DARK_MODE_KEY
  } else {
    return LIGHT_MODE_KEY
  }
}

export function getColorLuminosity(hexCode: string) {
  let c = hexCode
  c = c.substring(1) // strip #
  const rgb = parseInt(c, 16) // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff // extract red
  const g = (rgb >> 8) & 0xff // extract green
  const b = (rgb >> 0) & 0xff // extract blue

  return 0.2126 * r + 0.7152 * g + 0.0722 * b // per ITU-R BT.709
}

export function shadeBlend(p: number, c0: string, c1?: string) {
  const n = p < 0 ? p * -1 : p,
    u = Math.round,
    w = parseInt
  if (c0.length > 7) {
    const f = c0.split(','),
      t = (c1 ? c1 : p < 0 ? 'rgb(0,0,0)' : 'rgb(255,255,255)').split(','),
      R = w(f[0].slice(4)),
      G = w(f[1]),
      B = w(f[2])
    return (
      'rgb(' +
      (u((w(t[0].slice(4)) - R) * n) + R) +
      ',' +
      (u((w(t[1]) - G) * n) + G) +
      ',' +
      (u((w(t[2]) - B) * n) + B) +
      ')'
    )
  } else {
    const f = w(c0.slice(1), 16),
      t = w((c1 ? c1 : p < 0 ? '#000000' : '#FFFFFF').slice(1), 16),
      R1 = f >> 16,
      G1 = (f >> 8) & 0x00ff,
      B1 = f & 0x0000ff
    return (
      '#' +
      (
        0x1000000 +
        (u(((t >> 16) - R1) * n) + R1) * 0x10000 +
        (u((((t >> 8) & 0x00ff) - G1) * n) + G1) * 0x100 +
        (u(((t & 0x0000ff) - B1) * n) + B1)
      )
        .toString(16)
        .slice(1)
    )
  }
}

export function darken(color: string, value = -0.15) {
  return shadeBlend(value, color)
}

export function lighten(color: string, value = 0.25) {
  return shadeBlend(value, color)
}

export function hexToRGBA(hex: string, alpha: number) {
  if (!hex || !hex.startsWith('#')) {
    return ''
  }
  let c: any
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('')
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
  } else {
    throw new Error('Bad Hex')
  }
}

export const getTintColorForEditor = (theme: DefaultTheme, tint: number): string | undefined => {
  const {
    stylekitInfoColor,
    stylekitDeepBlush,
    stylekitCorn,
    stylekitPurpleHeart,
    stylekitMountainMeadow,
    stylekitJaffa,
  } = theme

  const tintColorsMap = new Map([
    [1, stylekitInfoColor],
    [2, stylekitDeepBlush],
    [3, stylekitCorn],
    [4, stylekitPurpleHeart],
    [5, stylekitMountainMeadow],
    [6, stylekitJaffa],
  ])
  return tintColorsMap.get(tint)
}
