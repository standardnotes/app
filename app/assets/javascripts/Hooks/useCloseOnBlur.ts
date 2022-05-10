import { StateUpdater, useCallback, useState } from 'preact/hooks'

/**
 * @returns a callback that will close a dropdown if none of its children has
 * focus. Use the returned function as the onBlur callback of children that need to be
 * monitored.
 */
export function useCloseOnBlur(
  container: { current?: HTMLDivElement | null },
  setOpen: (open: boolean) => void,
  keepOpenOnDialogs = false,
): [(event: { relatedTarget: EventTarget | null }) => void, StateUpdater<boolean>] {
  const [locked, setLocked] = useState(false)
  return [
    useCallback(
      function onBlur(event: { relatedTarget: EventTarget | null }) {
        setTimeout(() => {
          const keepOpen = keepOpenOnDialogs && document.activeElement?.closest('[role="dialog"], .sk-modal')
          if (!keepOpen && !locked && !container.current?.contains(event.relatedTarget as Node)) {
            setOpen(false)
          }
        })
      },
      [keepOpenOnDialogs, locked, container, setOpen],
    ),
    setLocked,
  ]
}
