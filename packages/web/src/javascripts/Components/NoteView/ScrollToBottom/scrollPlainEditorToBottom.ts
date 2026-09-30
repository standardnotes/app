import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'

export function scrollPlainEditorToBottom(plainEditor: PlainEditorInterface): boolean {
  const textarea = plainEditor.getTextarea()
  if (!textarea || textarea.disabled || textarea.readOnly) {
    return false
  }

  const length = plainEditor.getText().length
  textarea.setSelectionRange(length, length)
  textarea.scrollTop = Math.max(0, textarea.scrollHeight - textarea.clientHeight)
  textarea.focus()

  return true
}
