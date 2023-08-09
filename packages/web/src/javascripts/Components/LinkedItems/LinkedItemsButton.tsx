import { LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import { useRef, useCallback } from 'react'
import RoundIconButton from '../Button/RoundIconButton'
import Popover from '../Popover/Popover'
import LinkedItemsPanel from './LinkedItemsPanel'

type Props = {
  linkingController: LinkingController
  onClickPreprocessing?: () => Promise<void>
}

const LinkedItemsButton = ({ linkingController, onClickPreprocessing }: Props) => {
  const { activeItem, isLinkingPanelOpen, setIsLinkingPanelOpen } = linkingController
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isLinkingPanelOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsLinkingPanelOpen(willMenuOpen)
  }, [isLinkingPanelOpen, onClickPreprocessing, setIsLinkingPanelOpen])

  if (!activeItem) {
    return null
  }

  return (
    <>
      <RoundIconButton label="Linked items panel" onClick={toggleMenu} ref={buttonRef} icon="link" />
      <Popover
        title="Linked items"
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isLinkingPanelOpen}
        className="pb-2"
      >
        <LinkedItemsPanel item={activeItem} />
      </Popover>
    </>
  )
}

export default observer(LinkedItemsButton)
