import { useCallback, useEffect } from 'preact/hooks'

export function useCloseOnClickOutside(
  container: { current: HTMLDivElement | null },
  callback: () => void,
): void {
  const closeOnClickOutside = useCallback(
    (event: { target: EventTarget | null }) => {
      if (!container.current) {
        return
      }
      const isDescendantOfContainer = container.current.contains(event.target as Node)
      const isDescendantOfDialog = (event.target as HTMLElement).closest('[role="dialog"]')
      if (!isDescendantOfContainer && !isDescendantOfDialog) {
        callback()
      }
    },
    [container, callback],
  )

  useEffect(() => {
    document.addEventListener('click', closeOnClickOutside, { capture: true })
    return () => {
      document.removeEventListener('click', closeOnClickOutside, {
        capture: true,
      })
    }
  }, [closeOnClickOutside])
}
