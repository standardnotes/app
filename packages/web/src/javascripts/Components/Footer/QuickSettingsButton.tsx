import { WebApplication } from '@/Application/WebApplication'
import { UIFeature, GetDarkThemeFeature } from '@standardnotes/snjs'
import { TOGGLE_DARK_MODE_COMMAND } from '@standardnotes/ui-services'
import { classNames } from '@standardnotes/utils'
import { useEffect, useRef, useState } from 'react'
import { useCommandService } from '../CommandProvider'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import QuickSettingsMenu from '../QuickSettingsMenu/QuickSettingsMenu'
import StyledTooltip from '../StyledTooltip/StyledTooltip'

type Props = {
  application: WebApplication
}

const QuickSettingsButton = ({ application }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const commandService = useCommandService()

  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(!isOpen)

  useEffect(() => {
    return commandService.addCommandHandler({
      command: TOGGLE_DARK_MODE_COMMAND,
      onKeyDown: () => {
        void application.componentManager.toggleTheme(new UIFeature(GetDarkThemeFeature()))
      },
    })
  }, [application, commandService])

  return (
    <>
      <StyledTooltip label="Open quick settings menu">
        <button
          onClick={toggleMenu}
          className="flex h-full w-8 cursor-pointer items-center justify-center"
          ref={buttonRef}
        >
          <div className="h-5">
            <Icon type="themes" className={classNames(isOpen && 'text-info', 'rounded hover:text-info')} />
          </div>
        </button>
      </StyledTooltip>
      <Popover
        title="Quick settings"
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="top"
        align="start"
        className="py-2"
      >
        <QuickSettingsMenu closeMenu={toggleMenu} />
      </Popover>
    </>
  )
}

export default QuickSettingsButton
