export enum EditorLineHeight {
  None = 'None',
  Tight = 'Tight',
  Snug = 'Snug',
  Normal = 'Normal',
  Relaxed = 'Relaxed',
  Loose = 'Loose',
}

// https://tailwindcss.com/docs/line-height
export const EditorLineHeightValues: { [key in EditorLineHeight]: number } = {
  None: 1,
  Tight: 1.25,
  Snug: 1.375,
  Normal: 1.5,
  Relaxed: 1.625,
  Loose: 2,
}
