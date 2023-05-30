import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useCallback, useMemo } from 'react'
import { isMobileScreen } from '@/Utils'
import { TOGGLE_FOCUS_MODE_COMMAND } from '@standardnotes/ui-services'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'

type Props = {
  application: WebApplication
  onToggle: (value: boolean) => void
  onClose: () => void
  isEnabled: boolean
}

const FocusModeSwitch: FunctionComponent<Props> = ({ application, onToggle, onClose, isEnabled }) => {
  const toggle = useCallback(() => {
    onToggle(!isEnabled)
    onClose()
  }, [onToggle, isEnabled, onClose])

  const shortcut = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(TOGGLE_FOCUS_MODE_COMMAND),
    [application],
  )

  const isMobile = application.isNativeMobileWeb() || isMobileScreen()

  if (isMobile) {
    return null
  }

  return (
    <MenuSwitchButtonItem onChange={toggle} shortcut={shortcut} checked={isEnabled}>
      Focus Mode
    </MenuSwitchButtonItem>
  )
}

export default FocusModeSwitch
