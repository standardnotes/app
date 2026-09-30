import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'

export function scrollPlainEditorToBottom(plainEditor: PlainEditorInterface): boolean {
  return plainEditor.scrollToEnd()
}
