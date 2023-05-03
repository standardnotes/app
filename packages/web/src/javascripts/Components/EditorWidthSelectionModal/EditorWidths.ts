import { EditorLineWidth } from '@standardnotes/snjs'

export const EditorMaxWidths: { [k in EditorLineWidth]: string } = {
  [EditorLineWidth.Narrow]: '512px',
  [EditorLineWidth.Wide]: '720px',
  [EditorLineWidth.Dynamic]: '80%',
  [EditorLineWidth.FullWidth]: '100%',
}

export const EditorMargins: { [k in EditorLineWidth]: string } = {
  [EditorLineWidth.Narrow]: 'auto',
  [EditorLineWidth.Wide]: 'auto',
  [EditorLineWidth.Dynamic]: '10%',
  [EditorLineWidth.FullWidth]: '0',
}
