import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import NotesOptions from './NotesOptions'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import Popover from '../Popover/Popover'
import RoundIconButton from '../Button/RoundIconButton'
import Menu from '../Menu/Menu'

type Props = {
  notesController: NotesController
  onClickPreprocessing?: () => Promise<void>
}

const NotesOptionsPanel = ({ notesController, onClickPreprocessing }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  const [disableClickOutside, setDisableClickOutside] = useState(false)
  const handleDisableClickOutsideRequest = useCallback((disabled: boolean) => {
    setDisableClickOutside(disabled)
  }, [])

  return (
    <>
      <RoundIconButton label="Note options menu" onClick={toggleMenu} ref={buttonRef} icon="more" />
      <Popover
        title="Note options"
        disableClickOutside={disableClickOutside}
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isOpen}
        className="select-none"
      >
        <Menu a11yLabel="Note options menu" isOpen={isOpen} className="pl-4 pr-4">
          <NotesOptions
            notes={notesController.selectedNotes}
            requestDisableClickOutside={handleDisableClickOutsideRequest}
            closeMenu={toggleMenu}
          />
        </Menu>
      </Popover>
    </>
  )
}

export default observer(NotesOptionsPanel)
