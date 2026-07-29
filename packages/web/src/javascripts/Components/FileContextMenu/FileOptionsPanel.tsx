import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { c } from 'ttag'
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
      <RoundIconButton
        label={c('B7.FilesSubscriptionHelp.Files.Label').t`File options menu`}
        onClick={toggleMenu}
        ref={buttonRef}
        icon="more"
      />
      <Popover
        title={c('B7.FilesSubscriptionHelp.Files.Title').t`File options`}
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isOpen}
        className="md:pb-2"
      >
        <Menu a11yLabel={c('B7.FilesSubscriptionHelp.Files.Info').t`File options panel`}>
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
