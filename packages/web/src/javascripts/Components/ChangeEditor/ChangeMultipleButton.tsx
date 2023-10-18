import { WebApplication } from '@/Application/WebApplication'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { useRef, useState } from 'react'
import RoundIconButton from '../Button/RoundIconButton'
import Popover from '../Popover/Popover'
import ChangeEditorMultipleMenu from './ChangeEditorMultipleMenu'

type Props = {
  application: WebApplication
  notesController: NotesController
}

const ChangeMultipleButton = ({ application, notesController }: Props) => {
  const changeButtonRef = useRef<HTMLButtonElement>(null)
  const [isChangeMenuOpen, setIsChangeMenuOpen] = useState(false)
  const toggleMenu = () => setIsChangeMenuOpen((open) => !open)
  const [disableClickOutside, setDisableClickOutside] = useState(false)

  return (
    <>
      <RoundIconButton label={'Change note type'} onClick={toggleMenu} ref={changeButtonRef} icon="plain-text" />
      <Popover
        title="Change note type"
        togglePopover={toggleMenu}
        disableClickOutside={disableClickOutside}
        anchorElement={changeButtonRef}
        open={isChangeMenuOpen}
        className="md:pb-1"
      >
        <ChangeEditorMultipleMenu
          application={application}
          notes={notesController.selectedNotes}
          setDisableClickOutside={setDisableClickOutside}
        />
      </Popover>
    </>
  )
}

export default ChangeMultipleButton
