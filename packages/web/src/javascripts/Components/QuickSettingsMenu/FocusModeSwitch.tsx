import { WebApplication } from '@/Application/Application'
import { FunctionComponent, MouseEventHandler, useCallback, useMemo } from 'react'
import Switch from '@/Components/Switch/Switch'
import { isMobileScreen } from '@/Utils'
import { TOGGLE_FOCUS_MODE_COMMAND } from '@standardnotes/ui-services'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import MenuItem from '../Menu/MenuItem'

type Props = {
  application: WebApplication
  onToggle: (value: boolean) => void
  onClose: () => void
  isEnabled: boolean
}

const FocusModeSwitch: FunctionComponent<Props> = ({ application, onToggle, onClose, isEnabled }) => {
  const toggle: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault()

      onToggle(!isEnabled)
      onClose()
    },
    [onToggle, isEnabled, onClose],
  )

  const shortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND),
    [application],
  )

  const isMobile = application.isNativeMobileWeb() || isMobileScreen()

  if (isMobile) {
    return null
  }

  return (
    <MenuItem onClick={toggle}>
      <div className="flex items-center">Focus Mode</div>
      <div className="ml-auto flex">
        {shortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={shortcut} />}
        <Switch className="px-0" checked={isEnabled} />
      </div>
    </MenuItem>
  )
}

export default FocusModeSwitch
