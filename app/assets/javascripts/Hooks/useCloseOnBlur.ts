import { Dispatch, SetStateAction, useCallback, useState } from 'react'

/**
 * @returns a callback that will close a dropdown if none of its children has
 * focus. Use the returned function as the onBlur callback of children that need to be
 * monitored.
 */
export function useCloseOnBlur(
  container: { current?: HTMLDivElement | null },
  setOpen: (open: boolean) => void,
): [(event: { relatedTarget: EventTarget | null }) => void, Dispatch<SetStateAction<boolean>>] {
  const [locked, setLocked] = useState(false)
  return [
    useCallback(
      function onBlur(event: { relatedTarget: EventTarget | null }) {
        if (!locked && !container.current?.contains(event.relatedTarget as Node)) {
          setOpen(false)
        }
      },
      [container, setOpen, locked],
    ),
    setLocked,
  ]
}
