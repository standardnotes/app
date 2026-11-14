import { useCallback, useEffect, useState } from 'react'
import { c } from 'ttag'
import {
  KeyboardCommand,
  KeyboardService,
  KeyboardShortcutBinding,
  isValidUserKeyboardShortcutBinding,
  keyboardShortcutBindingForEvent,
} from '@standardnotes/ui-services'

/**
 * Records the next key combination pressed for a command. While recording, app shortcuts are suspended
 * and key presses are captured before anything else (e.g. the modal's Escape-to-close) sees them.
 */
export const useKeyboardShortcutRecorder = (
  keyboardService: KeyboardService,
  onRecorded: (command: KeyboardCommand, binding: KeyboardShortcutBinding) => void,
) => {
  const [recordingCommand, setRecordingCommand] = useState<KeyboardCommand>()
  const [recordingHint, setRecordingHint] = useState<string>()

  const startRecording = useCallback((command: KeyboardCommand) => {
    setRecordingHint(undefined)
    setRecordingCommand(command)
  }, [])

  const stopRecording = useCallback(() => {
    setRecordingCommand(undefined)
    setRecordingHint(undefined)
  }, [])

  useEffect(() => {
    if (!recordingCommand) {
      return
    }

    keyboardService.disableEventHandling()

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const binding = keyboardShortcutBindingForEvent(event)
      if (!binding) {
        return
      }

      if (binding.key === 'Escape' && binding.modifiers?.length === 0) {
        stopRecording()
        return
      }

      if (!isValidUserKeyboardShortcutBinding(binding)) {
        setRecordingHint(
          keyboardService.isMac
            ? c('B2.NavSharedUI.Info').t`Include a modifier key such as ⌘, ⌥ or ⌃`
            : c('B2.NavSharedUI.Info').t`Include a modifier key such as Ctrl or Alt`,
        )
        return
      }

      onRecorded(recordingCommand, binding)
      stopRecording()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      keyboardService.enableEventHandling()
    }
  }, [recordingCommand, keyboardService, onRecorded, stopRecording])

  return { recordingCommand, recordingHint, startRecording, stopRecording }
}
