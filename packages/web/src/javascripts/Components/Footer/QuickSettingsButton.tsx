import { WebApplication } from '@/Application/Application'
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
  quickSettingsMenuController: QuickSettingsController
}

const QuickSettingsButton = ({ application, isOpen, toggleMenu, quickSettingsMenuController }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        onClick={toggleMenu}
        className="flex h-full w-8 cursor-pointer items-center justify-center"
        ref={buttonRef}
      >
        <div className="h-5">
          <Icon type="themes" className={classNames(isOpen && 'text-info', 'rounded hover:text-info')} />
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
        <QuickSettingsMenu quickSettingsMenuController={quickSettingsMenuController} application={application} />
      </Popover>
    </>
  )
}

export default QuickSettingsButton
