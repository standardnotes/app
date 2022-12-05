import { WebApplication } from '@/Application/Application'
import { QuickSettingsController } from '@/Controllers/QuickSettingsController'
import { FeatureIdentifier, SNTheme } from '@standardnotes/snjs'
import { TOGGLE_DARK_MODE_COMMAND } from '@standardnotes/ui-services'
import { classNames } from '@standardnotes/utils'
import { useEffect, useRef } from 'react'
import { useCommandService } from '../CommandProvider'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import QuickSettingsMenu from '../QuickSettingsMenu/QuickSettingsMenu'
import StyledTooltip from '../StyledTooltip/StyledTooltip'

type Props = {
  isOpen: boolean
  toggleMenu: () => void
  application: WebApplication
  quickSettingsMenuController: QuickSettingsController
}

const QuickSettingsButton = ({ application, isOpen, toggleMenu, quickSettingsMenuController }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const commandService = useCommandService()

  useEffect(() => {
    return commandService.addCommandHandler({
      command: TOGGLE_DARK_MODE_COMMAND,
      onKeyDown: () => {
        const darkTheme = application.items
          .getDisplayableComponents()
          .find((theme) => theme.package_info.identifier === FeatureIdentifier.DarkTheme) as SNTheme | undefined
        if (darkTheme) {
          void application.mutator.toggleTheme(darkTheme)
        }
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
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="top"
        align="start"
        className="py-2"
      >
        <QuickSettingsMenu quickSettingsMenuController={quickSettingsMenuController} application={application} />
      </Popover>
    </>
  )
}

export default QuickSettingsButton
