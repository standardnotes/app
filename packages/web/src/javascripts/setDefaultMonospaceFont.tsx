import { Platform } from '@standardnotes/snjs'

export const setDefaultMonospaceFont = (platform?: Platform) => {
  if (platform === Platform.Android) {
    document.documentElement.style.setProperty(
      '--sn-stylekit-monospace-font',
      '"Roboto Mono", "Droid Sans Mono", monospace',
    )
  }
}
