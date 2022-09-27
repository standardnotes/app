import Icon from '@/Components/Icon/Icon'
import { useCallback, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import NotesOptions from './NotesOptions'
import { WebApplication } from '@/Application/Application'
import { NotesController } from '@/Controllers/NotesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import Popover from '../Popover/Popover'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
  historyModalController: HistoryModalController
  onClickPreprocessing?: () => Promise<void>
}

const NotesOptionsPanel = ({
  application,
  navigationController,
  notesController,
  noteTagsController,
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
      <button
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
        title="Note options menu"
        aria-label="Note options menu"
        onClick={toggleMenu}
        ref={buttonRef}
      >
        <Icon type="more" />
      </button>
      <Popover togglePopover={toggleMenu} anchorElement={buttonRef.current} open={isOpen} className="select-none py-2">
        <NotesOptions
          application={application}
          navigationController={navigationController}
          notesController={notesController}
          noteTagsController={noteTagsController}
          historyModalController={historyModalController}
          closeMenu={toggleMenu}
        />
      </Popover>
    </>
  )
}

export default observer(NotesOptionsPanel)
