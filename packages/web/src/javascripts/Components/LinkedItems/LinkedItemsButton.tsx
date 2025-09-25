import { LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import { useRef, useCallback, useEffect } from 'react'
import RoundIconButton from '../Button/RoundIconButton'
import Popover from '../Popover/Popover'
import LinkedItemsPanel from './LinkedItemsPanel'
import { useApplication } from '../ApplicationProvider'

type Props = {
  linkingController: LinkingController
  onClick?: () => void
  onClickPreprocessing?: () => Promise<void>
}

const LinkedItemsButton = ({ linkingController, onClick, onClickPreprocessing }: Props) => {
  const application = useApplication()
  const { activeItem, isLinkingPanelOpen, setIsLinkingPanelOpen } = linkingController
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isLinkingPanelOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsLinkingPanelOpen(willMenuOpen)
    if (onClick) {
      onClick()
    }
  }, [isLinkingPanelOpen, onClick, onClickPreprocessing, setIsLinkingPanelOpen])

  useEffect(() => application.commands.add('open-linked-items-panel', 'Open linked items panel', toggleMenu, 'link'))

  if (!activeItem) {
    return null
  }

  return (
    <>
      <RoundIconButton label="Linked items panel" onClick={toggleMenu} ref={buttonRef} icon="link" />
      <Popover
        title="Linked items"
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isLinkingPanelOpen}
        className="pb-2"
        forceFullHeightOnMobile
      >
        <LinkedItemsPanel item={activeItem} />
      </Popover>
    </>
  )
}

export default observer(LinkedItemsButton)
