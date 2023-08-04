const RGBRegex = /-?\b[0-9]{1,3}\b/g

export class Color {
  r: number = 0
  g: number = 0
  b: number = 0
  a: number = 1

  constructor(color: string) {
    if (color.startsWith('rgb')) {
      this.setFromRGB(color)
    } else if (color.startsWith('#')) {
      this.setFromHex(color)
    } else {
      throw new Error('Invalid color')
    }
  }

  /**
   * Sets the color from a hex string
   * @param hex - The hex string to set
   */
  setFromHex(hex: string) {
    if (!hex.startsWith('#')) {
      throw new Error('Invalid color')
    }
    const hexValue = hex.substring(1)
    if (hexValue.length !== 3 && hexValue.length !== 6) {
      throw new Error('Invalid color')
    }
    const r = parseInt(hexValue.substring(0, 2), 16)
    const g = parseInt(hexValue.substring(2, 4), 16)
    const b = parseInt(hexValue.substring(4, 6), 16)
    this.r = r
    this.g = g
    this.b = b
  }

  /**
   * Sets the color from an RGB string
   * @param color - The RGB string to set
   */
  setFromRGB(color: string) {
    if (!color.startsWith('rgb')) {
      throw new Error('Invalid color')
    }
    const regexMatches = color.match(RGBRegex)
    if (!regexMatches || regexMatches.length !== 3) {
      throw new Error('Invalid color')
    }
    const [r, g, b] = regexMatches.map((value) => parseInt(value, 10))
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('Invalid color')
    }
    this.r = r
    this.g = g
    this.b = b
  }

  /**
   * Sets the alpha value of the color
   * @param alpha - The alpha value to set (0-1)
   */
  setAlpha(alpha: number) {
    if (alpha < 0 || alpha > 1) {
      throw new Error('Invalid alpha value')
    }
    this.a = alpha
    return this
  }

  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
  }

  /**
   * Returns true if the color is dark
   * Based on RGB->YIQ equation https://24ways.org/2010/calculating-color-contrast
   */
  isDark() {
    const yiq = (this.r * 299 + this.g * 587 + this.b * 114) / 1000
    return yiq <= 128
  }
}
