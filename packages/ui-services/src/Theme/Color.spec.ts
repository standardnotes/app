import { Color } from './Color'

describe('Color', () => {
  it('should throw an error if the color is invalid', () => {
    expect(() => new Color('#ff')).toThrowError('Invalid color')
  })

  it('should parse a rgb string', () => {
    const color = new Color('rgb(255, 0, 0)')
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(1)
  })

  it('should throw error if rgb string is invalid', () => {
    expect(() => new Color('rgb(255, 0)')).toThrowError('Invalid color')
    expect(() => new Color('rgb(266, -1, 0)')).toThrowError('Invalid color')
  })

  it('should parse a hex string', () => {
    const color = new Color('#ff0000')
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(1)
  })

  it('should throw error if hex string is invalid', () => {
    expect(() => new Color('#ff')).toThrowError('Invalid color')
    expect(() => new Color('#ff000')).toThrowError('Invalid color')
    expect(() => new Color('#ff00000')).toThrowError('Invalid color')
  })

  it('should set the alpha value', () => {
    const color = new Color('rgb(255, 0, 0)')
    color.setAlpha(0.5)
    expect(color.a).toBe(0.5)
  })

  it('should throw error if alpha value is invalid', () => {
    const color = new Color('rgb(255, 0, 0)')
    expect(() => color.setAlpha(-1)).toThrowError('Invalid alpha value')
    expect(() => color.setAlpha(1.1)).toThrowError('Invalid alpha value')
  })

  it('should convert to string', () => {
    const color = new Color('rgb(255, 0, 0)')
    color.setAlpha(0.5)
    expect(color.toString()).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('should return correct isDark value', () => {
    const autobiographyThemeBG = 'rgb(237, 228, 218)'
    const darkThemeBG = 'rgb(15, 16, 17)'
    const solarizedThemeBG = 'rgb(0, 43, 54)'
    const titaniumThemeBG = 'rgb(238, 239, 241)'

    expect(new Color(autobiographyThemeBG).isDark()).toBe(false)
    expect(new Color(darkThemeBG).isDark()).toBe(true)
    expect(new Color(solarizedThemeBG).isDark()).toBe(true)
    expect(new Color(titaniumThemeBG).isDark()).toBe(false)
  })
})
