import { WebApplication } from '@/Application/Application'
import { FunctionComponent, MouseEventHandler, useCallback, useMemo } from 'react'
import Switch from '@/Components/Switch/Switch'
import { isMobileScreen } from '@/Utils'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { TOGGLE_FOCUS_MODE_COMMAND } from '@standardnotes/ui-services'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'

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
    <button
      className={classNames(
        'group flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left',
        'text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none disabled:bg-default disabled:text-passive-2',
        'text-mobile-menu-item md:text-tablet-menu-item lg:text-menu-item',
      )}
      onClick={toggle}
    >
      <div className="flex items-center">Focused Writing</div>
      <div className="flex">
        {shortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={shortcut} />}
        <Switch className="px-0" checked={isEnabled} />
      </div>
    </button>
  )
}

export default FocusModeSwitch
