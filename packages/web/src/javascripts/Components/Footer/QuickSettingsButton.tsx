import { WebApplication } from '@/Application/Application'
import { PreferencesController } from '@/Controllers/PreferencesController'
import { QuickSettingsController } from '@/Controllers/QuickSettingsController'
import { useRef, useState } from 'react'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import QuickSettingsMenu from '../QuickSettingsMenu/QuickSettingsMenu'

type Props = {
  isOpen: boolean
  onClickOutside: () => void
  toggleMenu: () => void
  application: WebApplication
  preferencesController: PreferencesController
  quickSettingsMenuController: QuickSettingsController
}

const QuickSettingsButton = ({
  application,
  // isOpen,
  onClickOutside,
  preferencesController,
  quickSettingsMenuController,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen((isOpen) => !isOpen)
  }

  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        onClick={toggleMenu}
        className="flex h-full w-8 cursor-pointer items-center justify-center"
        ref={buttonRef}
      >
        <div className="h-5">
          <Icon type="tune" className={(isOpen ? 'text-info' : '') + ' rounded hover:text-info'} />
        </div>
      </button>
      <Popover buttonRef={buttonRef} open={isOpen} side="top" align="start">
        <QuickSettingsMenu
          onClickOutside={onClickOutside}
          preferencesController={preferencesController}
          quickSettingsMenuController={quickSettingsMenuController}
          application={application}
        />
      </Popover>
    </>
  )
}

export default QuickSettingsButton
