import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import ChangeEditorMenu from './ChangeEditorMenu'
import Popover from '../Popover/Popover'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  onClickPreprocessing?: () => Promise<void>
}

const ChangeEditorButton: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  onClickPreprocessing,
}: Props) => {
  const note = viewControllerManager.notesController.firstSelectedNote
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  return (
    <div ref={containerRef}>
      <button
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
        title="Change note type"
        aria-label="Change note type"
        onClick={toggleMenu}
        ref={buttonRef}
      >
        <Icon type="dashboard" />
      </button>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen}>
        <ChangeEditorMenu
          application={application}
          isVisible={isOpen}
          note={note}
          closeMenu={() => {
            setIsOpen(false)
          }}
        />
      </Popover>
    </div>
  )
}

export default observer(ChangeEditorButton)
