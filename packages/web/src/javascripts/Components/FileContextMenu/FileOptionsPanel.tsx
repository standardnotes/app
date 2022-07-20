import Icon from '@/Components/Icon/Icon'
import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import FileMenuOptions from './FileMenuOptions'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import Popover from '../Popover/Popover'

type Props = {
  filesController: FilesController
  selectionController: SelectedItemsController
}

const FilesOptionsPanel = ({ filesController, selectionController }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(() => setIsOpen((isOpen) => !isOpen), [])

  return (
    <>
      <button
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
        title="File options menu"
        aria-label="File options menu"
        onClick={toggleMenu}
        ref={buttonRef}
      >
        <Icon type="more" />
      </button>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="py-2">
        <FileMenuOptions
          filesController={filesController}
          selectionController={selectionController}
          closeMenu={() => {
            setIsOpen(false)
          }}
          shouldShowAttachOption={false}
          shouldShowRenameOption={false}
        />
      </Popover>
    </>
  )
}

export default observer(FilesOptionsPanel)
