export function scrollComponentEditorToBottom(
  editorContentElement: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): boolean {
  editorContentElement.scrollTo({
    top: editorContentElement.scrollHeight,
    behavior,
  })

  const iframe = editorContentElement.querySelector('iframe')
  iframe?.contentWindow?.focus()

  try {
    const iframeDocument = iframe?.contentDocument
    if (iframeDocument) {
      iframeDocument.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'End',
          ctrlKey: true,
          bubbles: true,
        }),
      )
    }
  } catch {
    // Cross-origin iframe: host scroll only.
  }

  return true
}
