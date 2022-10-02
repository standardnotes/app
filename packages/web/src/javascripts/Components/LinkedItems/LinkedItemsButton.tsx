import { LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import { useState, useRef, useCallback } from 'react'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import LinkedItemsPanel from './LinkedItemsPanel'

type Props = {
  linkingController: LinkingController
  onClickPreprocessing?: () => Promise<void>
}

const LinkedItemsButton = ({ linkingController, onClickPreprocessing }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  return (
    <>
      <StyledTooltip label="Linked items panel">
        <button
          className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
          aria-label="Linked items panel"
          onClick={toggleMenu}
          ref={buttonRef}
        >
          <Icon type="link" />
        </button>
      </StyledTooltip>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="pb-2">
        <LinkedItemsPanel linkingController={linkingController} />
      </Popover>
    </>
  )
}

export default observer(LinkedItemsButton)
