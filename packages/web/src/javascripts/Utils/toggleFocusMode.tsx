import { focusModeAnimationDuration } from '../Components/QuickSettingsMenu/QuickSettingsMenu'

export const FOCUS_MODE_CLASS_NAME = 'focus-mode'
export const DISABLING_FOCUS_MODE_CLASS_NAME = 'disable-focus-mode'

export const toggleFocusMode = (enabled: boolean) => {
  if (enabled) {
    document.body.classList.add(FOCUS_MODE_CLASS_NAME)
    return
  }

  if (document.body.classList.contains(FOCUS_MODE_CLASS_NAME)) {
    document.body.classList.add(DISABLING_FOCUS_MODE_CLASS_NAME)
    document.body.classList.remove(FOCUS_MODE_CLASS_NAME)

    setTimeout(() => {
      document.body.classList.remove(DISABLING_FOCUS_MODE_CLASS_NAME)
    }, focusModeAnimationDuration)
  }
}
