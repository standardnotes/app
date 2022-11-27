import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import FileMenuOptions from './FileMenuOptions'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import Popover from '../Popover/Popover'
import RoundIconButton from '../Button/RoundIconButton'
import Menu from '../Menu/Menu'

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
      <RoundIconButton label="File options menu" onClick={toggleMenu} ref={buttonRef} icon="more" />
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="py-2">
        <Menu a11yLabel="File options panel" isOpen={isOpen}>
          <FileMenuOptions
            filesController={filesController}
            selectionController={selectionController}
            closeMenu={() => {
              setIsOpen(false)
            }}
            shouldShowAttachOption={false}
            shouldShowRenameOption={false}
          />
        </Menu>
      </Popover>
    </>
  )
}

export default observer(FilesOptionsPanel)
