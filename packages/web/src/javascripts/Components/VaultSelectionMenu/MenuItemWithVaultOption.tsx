import { VaultListingInterface, classNames } from '@standardnotes/snjs'
import { useState, useRef } from 'react'
import Icon from '../Icon/Icon'
import VaultOptionsMenu from './VaultOptionsMenu'
import Popover from '../Popover/Popover'

const VaultSelectMenuItemWithOptions = ({
  vault,
  children,
}: {
  vault: VaultListingInterface
  children: React.ReactNode
}) => {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false)
  const optionsButtonRef = useRef<HTMLButtonElement>(null)

  const toggleOptionsMenu = () => {
    setIsOptionsMenuOpen((open) => !open)
  }

  return (
    <div className="group flex items-center gap-3 px-3 focus-within:bg-info-backdrop">
      {children}
      <button
        className={classNames(
          'flex-shrink-0 rounded-full border border-border p-1 hover:bg-default focus:bg-default group-focus-within:bg-default',
          isOptionsMenuOpen && 'bg-default',
        )}
        onClick={toggleOptionsMenu}
        ref={optionsButtonRef}
      >
        <Icon type="more" size="small" />
      </button>
      <Popover
        title="Vault options"
        open={isOptionsMenuOpen}
        anchorElement={optionsButtonRef}
        side="top"
        align="start"
        className="py-1"
        togglePopover={toggleOptionsMenu}
      >
        <VaultOptionsMenu vault={vault} />
      </Popover>
    </div>
  )
}

export default VaultSelectMenuItemWithOptions
