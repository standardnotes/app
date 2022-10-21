import { FilesController } from '@/Controllers/FilesController'
import { LinkingController } from '@/Controllers/LinkingController'
import { observer } from 'mobx-react-lite'
import { useRef, useCallback } from 'react'
import RoundIconButton from '../Button/RoundIconButton'
import Popover from '../Popover/Popover'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import LinkedItemsPanel from './LinkedItemsPanel'

type Props = {
  linkingController: LinkingController
  onClickPreprocessing?: () => Promise<void>
  filesController: FilesController
}

const LinkedItemsButton = ({ linkingController, filesController, onClickPreprocessing }: Props) => {
  const { isLinkingPanelOpen, setIsLinkingPanelOpen } = linkingController
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isLinkingPanelOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsLinkingPanelOpen(willMenuOpen)
  }, [isLinkingPanelOpen, onClickPreprocessing, setIsLinkingPanelOpen])

  return (
    <>
      <StyledTooltip label="Linked items panel">
        <RoundIconButton label="Linked items panel" onClick={toggleMenu} ref={buttonRef} icon="link" />
      </StyledTooltip>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isLinkingPanelOpen} className="pb-2">
        <LinkedItemsPanel
          isOpen={isLinkingPanelOpen}
          linkingController={linkingController}
          filesController={filesController}
        />
      </Popover>
    </>
  )
}

export default observer(LinkedItemsButton)
