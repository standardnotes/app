import { WebApplication } from '@/Application/Application'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { QuickSettingsController } from '@/Controllers/QuickSettingsController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useRef } from 'react'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import QuickSettingsMenu from '../QuickSettingsMenu/QuickSettingsMenu'

type Props = {
  isOpen: boolean
  toggleMenu: () => void
  application: WebApplication
  preferencesController: PreferencesController
  quickSettingsMenuController: QuickSettingsController
}

const QuickSettingsButton = ({
  application,
  isOpen,
  toggleMenu,
  preferencesController,
  quickSettingsMenuController,
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        onClick={toggleMenu}
        className="flex h-full w-12 cursor-pointer items-center justify-center md:w-8"
        ref={buttonRef}
      >
        <div className="h-5">
          <Icon type="tune" className={classNames(isOpen && 'text-info', 'rounded hover:text-info')} />
        </div>
      </button>
      <Popover
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="top"
        align="start"
        className="py-2"
      >
        <QuickSettingsMenu
          preferencesController={preferencesController}
          quickSettingsMenuController={quickSettingsMenuController}
          application={application}
        />
      </Popover>
    </>
  )
}

export default QuickSettingsButton
