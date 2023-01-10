import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import FileMenuOptions from './FileMenuOptions'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import Popover from '../Popover/Popover'
import RoundIconButton from '../Button/RoundIconButton'
import Menu from '../Menu/Menu'
import { LinkingController } from '@/Controllers/LinkingController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'

type Props = {
  filesController: FilesController
  selectionController: SelectedItemsController
  linkingController: LinkingController
  navigationController: NavigationController
}

const FilesOptionsPanel = ({
  filesController,
  linkingController,
  navigationController,
  selectionController,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(() => setIsOpen((isOpen) => !isOpen), [])

  return (
    <>
      <RoundIconButton label="File options menu" onClick={toggleMenu} ref={buttonRef} icon="more" />
      <Popover
        title="File options"
        togglePopover={toggleMenu}
        anchorElement={buttonRef.current}
        open={isOpen}
        className="py-2"
      >
        <Menu a11yLabel="File options panel" isOpen={isOpen}>
          <FileMenuOptions
            filesController={filesController}
            linkingController={linkingController}
            navigationController={navigationController}
            selectedFiles={selectionController.selectedFiles}
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
