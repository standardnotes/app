import { EditorFontFamily, EditorFontFamilyValues } from '@standardnotes/snjs'

export const reloadFont = (fontFamily?: EditorFontFamily | boolean) => {
  const root = document.querySelector(':root') as HTMLElement
  const propertyName = '--sn-stylekit-editor-font-family'

  let resolvedFont: EditorFontFamily = EditorFontFamily.SansSerif
  if (typeof fontFamily === 'boolean') {
    resolvedFont = fontFamily ? EditorFontFamily.Monospace : EditorFontFamily.SansSerif
  } else if (fontFamily) {
    resolvedFont = fontFamily
  }

  const value = EditorFontFamilyValues[resolvedFont] || EditorFontFamilyValues[EditorFontFamily.SansSerif]
  root.style.setProperty(propertyName, value)

  const isMonospace = resolvedFont === EditorFontFamily.Monospace || resolvedFont === EditorFontFamily.RobotoMono
  document.documentElement.classList.toggle('monospace-font', isMonospace)
}
