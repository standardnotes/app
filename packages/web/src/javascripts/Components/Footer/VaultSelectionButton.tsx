import { classNames } from '@standardnotes/utils'
import { useRef } from 'react'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import { VaultSelectionController } from '@/Controllers/VaultSelectionController'
import VaultSelectionMenu from '../VaultSelectionMenu/VaultSelectionMenu'

type Props = {
  isOpen: boolean
  toggleMenu: () => void
  controller: VaultSelectionController
}

const VaultSelectionButton = ({ isOpen, toggleMenu, controller }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <StyledTooltip label="Open quick settings menu">
        <button
          onClick={toggleMenu}
          className="flex h-full w-8 cursor-pointer items-center justify-center"
          ref={buttonRef}
        >
          <div className="h-5">
            <Icon type="safe-square" className={classNames(isOpen && 'text-info', 'rounded hover:text-info')} />
          </div>
        </button>
      </StyledTooltip>
      <Popover
        title="Vault options"
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        side="top"
        align="start"
        className="py-2"
      >
        <VaultSelectionMenu controller={controller} />
      </Popover>
    </>
  )
}

export default VaultSelectionButton
