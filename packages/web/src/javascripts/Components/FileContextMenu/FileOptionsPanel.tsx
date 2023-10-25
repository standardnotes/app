import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import FileMenuOptions from './FileMenuOptions'
import Popover from '../Popover/Popover'
import RoundIconButton from '../Button/RoundIconButton'
import Menu from '../Menu/Menu'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'

type Props = {
  itemListController: ItemListController
}

const FilesOptionsPanel = ({ itemListController }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(() => setIsOpen((isOpen) => !isOpen), [])

  return (
    <>
      <RoundIconButton label="File options menu" onClick={toggleMenu} ref={buttonRef} icon="more" />
      <Popover
        title="File options"
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isOpen}
        className="md:pb-2"
      >
        <Menu a11yLabel="File options panel">
          <FileMenuOptions
            selectedFiles={itemListController.selectedFiles}
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
