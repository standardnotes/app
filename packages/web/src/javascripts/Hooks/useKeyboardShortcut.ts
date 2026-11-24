import { useEffect, useState } from 'react'
import { KeyboardCommand, KeyboardService, PlatformedKeyboardShortcut } from '@standardnotes/ui-services'

/**
 * Returns the current shortcut for a command, updating when shortcuts are customized.
 * Pass `undefined` as the command to get no shortcut.
 */
export const useKeyboardShortcut = (
  keyboardService: KeyboardService,
  command: KeyboardCommand | undefined,
): PlatformedKeyboardShortcut | undefined => {
  const getShortcut = () => {
    return command ? keyboardService.keyboardShortcutForCommand(command) : undefined
  }

  const [shortcut, setShortcut] = useState(getShortcut)

  useEffect(() => {
    const update = () => {
      setShortcut(command ? keyboardService.keyboardShortcutForCommand(command) : undefined)
    }
    update()
    return keyboardService.addShortcutChangeObserver(update)
  }, [keyboardService, command])

  return shortcut
}
