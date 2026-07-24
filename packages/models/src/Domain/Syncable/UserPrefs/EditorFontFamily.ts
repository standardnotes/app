export enum EditorFontFamily {
  SansSerif = 'SansSerif',
  Monospace = 'Monospace',
  Serif = 'Serif',
  Lora = 'Lora',
  Merriweather = 'Merriweather',
  OpenSans = 'OpenSans',
  RobotoMono = 'RobotoMono',
  Dyslexic = 'Dyslexic',
  Quicksand = 'Quicksand',
  ComicSans = 'ComicSans',
}

export const EditorFontFamilyValues: { [key in EditorFontFamily]: string } = {
  SansSerif: 'var(--sn-stylekit-sans-serif-font)',
  Monospace: 'var(--sn-stylekit-monospace-font)',
  Serif: 'Georgia, Times New Roman, Times, serif',
  Lora: 'Lora, Georgia, serif',
  Merriweather: 'Merriweather, Georgia, serif',
  OpenSans: 'Open Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  RobotoMono: 'Roboto Mono, var(--sn-stylekit-monospace-font)',
  Dyslexic: 'Comic Neue, Comic Sans MS, sans-serif',
  Quicksand: 'Quicksand, Open Sans, Segoe UI, sans-serif',
  ComicSans: 'Comic Sans MS, Comic Sans, Comic Neue, cursive, sans-serif',
}
