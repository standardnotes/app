import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { useRef, useState } from 'react'
import RoundIconButton from '../Button/RoundIconButton'
import Popover from '../Popover/Popover'
import ChangeMultipleMenu from './ChangeMultipleMenu'

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
        anchorElement={changeButtonRef.current}
        open={isChangeMenuOpen}
        className="pt-2 md:pt-0"
      >
        <ChangeMultipleMenu
          application={application}
          notes={notesController.selectedNotes}
          setDisableClickOutside={setDisableClickOutside}
        />
      </Popover>
    </>
  )
}

export default ChangeMultipleButton
