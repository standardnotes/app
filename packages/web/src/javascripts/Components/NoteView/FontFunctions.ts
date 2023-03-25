export const reloadFont = (monospaceFont?: boolean) => {
  const root = document.querySelector(':root') as HTMLElement
  const propertyName = '--sn-stylekit-editor-font-family'
  if (monospaceFont) {
    root.style.setProperty(propertyName, 'var(--sn-stylekit-monospace-font)')
  } else {
    root.style.setProperty(propertyName, 'var(--sn-stylekit-sans-serif-font)')
  }
  document.documentElement.classList.toggle('monospace-font', monospaceFont)
}
