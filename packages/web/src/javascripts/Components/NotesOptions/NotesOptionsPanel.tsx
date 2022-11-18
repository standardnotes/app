import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import NotesOptions from './NotesOptions'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import Popover from '../Popover/Popover'
import { LinkingController } from '@/Controllers/LinkingController'
import RoundIconButton from '../Button/RoundIconButton'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  linkingController: LinkingController
  historyModalController: HistoryModalController
  onClickPreprocessing?: () => Promise<void>
}

const NotesOptionsPanel = ({
  application,
  navigationController,
  notesController,
  linkingController,
  historyModalController,
  onClickPreprocessing,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleMenu = useCallback(async () => {
    const willMenuOpen = !isOpen
    if (willMenuOpen && onClickPreprocessing) {
      await onClickPreprocessing()
    }
    setIsOpen(willMenuOpen)
  }, [onClickPreprocessing, isOpen])

  return (
    <>
      <RoundIconButton label="Note options menu" onClick={toggleMenu} ref={buttonRef} icon="more" />
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="select-none">
        <NotesOptions
          application={application}
          navigationController={navigationController}
          notesController={notesController}
          linkingController={linkingController}
          historyModalController={historyModalController}
          closeMenu={toggleMenu}
        />
      </Popover>
    </>
  )
}

export default observer(NotesOptionsPanel)
