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
import RoundIconButton from '../Button/RoundIconButton'

type Props = {
  application: WebApplication
  isMobileNavigation?: boolean
}

const QuickSettingsButton = ({ application, isMobileNavigation = false }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const commandService = useCommandService()

  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => setIsOpen(!isOpen)

  useEffect(() => {
    const darkThemeFeature = new UIFeature(GetDarkThemeFeature())

    return commandService.addCommandHandler({
      command: TOGGLE_DARK_MODE_COMMAND,
      category: 'General',
      description: 'Toggle dark mode',
      onKeyDown: () => {
        void application.componentManager.toggleTheme(darkThemeFeature)
        return true
      },
    })
  }, [application, commandService])

  return (
    <>
      <StyledTooltip label="Open quick settings menu">
        {isMobileNavigation ? (
          <RoundIconButton className="ml-2.5 bg-default" onClick={toggleMenu} label="Go to vaults menu" icon="themes" />
        ) : (
          <button
            onClick={toggleMenu}
            className="flex h-full w-8 cursor-pointer items-center justify-center"
            ref={buttonRef}
          >
            <div className="h-5">
              <Icon type="themes" className={classNames(isOpen && 'text-info', 'rounded hover:text-info')} />
            </div>
          </button>
        )}
      </StyledTooltip>
      <Popover
        title="Quick settings"
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isOpen}
        side="top"
        align="start"
        className="md:py-2"
      >
        <QuickSettingsMenu closeMenu={toggleMenu} />
      </Popover>
    </>
  )
}

export default QuickSettingsButton
