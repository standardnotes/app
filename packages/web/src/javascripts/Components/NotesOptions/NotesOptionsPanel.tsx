import { FocusEvent, useCallback, useRef, useState } from 'react'
import { c } from 'ttag'
import { observer } from 'mobx-react-lite'
import NotesOptions from './NotesOptions'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import Popover from '../Popover/Popover'
import RoundIconButton from '../Button/RoundIconButton'
import Menu from '../Menu/Menu'
import { ElementIds } from '@/Constants/ElementIDs'

type Props = {
  notesController: NotesController
  onClick?: () => void
  onClickPreprocessing?: () => Promise<void>
  onButtonBlur?: (event: FocusEvent) => void
}

const NotesOptionsPanel = ({ notesController, onClick, onClickPreprocessing, onButtonBlur }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
    if (onClick) {
      onClick()
    }
  }, [isOpen, onClickPreprocessing, onClick])

  const [disableClickOutside, setDisableClickOutside] = useState(false)
  const handleDisableClickOutsideRequest = useCallback((disabled: boolean) => {
    setDisableClickOutside(disabled)
  }, [])

  return (
    <>
      <RoundIconButton
        id={ElementIds.NoteOptionsButton}
        label={c('B3.Notes.NoteActions.Label').t`Note options menu`}
        onClick={toggleMenu}
        onBlur={onButtonBlur}
        ref={buttonRef}
        icon="more"
      />
      <Popover
        title={c('B3.Notes.NoteActions.Label').t`Note options`}
        disableClickOutside={disableClickOutside}
        togglePopover={toggleMenu}
        anchorElement={buttonRef}
        open={isOpen}
        className="select-none"
      >
        <Menu a11yLabel={c('B3.Notes.NoteActions.Label').t`Note options menu`}>
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
