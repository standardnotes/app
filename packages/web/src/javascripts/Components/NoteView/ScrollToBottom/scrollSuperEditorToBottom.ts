import type { SuperEditorInterface } from '@/Components/SuperEditor/SuperEditor'

export function scrollSuperEditorToBottom(
  superEditor: SuperEditorInterface,
  behavior: ScrollBehavior = 'smooth',
): boolean {
  return superEditor.scrollToEnd(behavior)
}
