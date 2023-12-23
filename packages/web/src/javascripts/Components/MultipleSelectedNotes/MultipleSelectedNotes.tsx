import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import NotesOptionsPanel from '@/Components/NotesOptions/NotesOptionsPanel'
import { WebApplication } from '@/Application/WebApplication'
import PinNoteButton from '@/Components/PinNoteButton/PinNoteButton'
import Button from '../Button/Button'
import { useCallback } from 'react'
import ChangeMultipleButton from '../ChangeEditor/ChangeMultipleButton'

type Props = {
  application: WebApplication
}

const MultipleSelectedNotes = ({ application }: Props) => {
  const { notesController, itemListController } = application
  const count = notesController.selectedNotesCount

  const cancelMultipleSelection = useCallback(() => {
    itemListController.cancelMultipleSelection()
  }, [itemListController])

  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between p-4">
        <h1 className="m-0 text-lg font-bold">{count} selected notes</h1>
        <div className="flex">
          <div className="mr-3">
            <ChangeMultipleButton application={application} notesController={notesController} />
          </div>
          <div className="mr-3">
            <PinNoteButton notesController={notesController} />
          </div>
          <NotesOptionsPanel notesController={notesController} />
        </div>
      </div>
      <div className="flex min-h-full w-full max-w-md flex-grow flex-col items-center justify-center md:min-h-0">
        <IlNotesIcon className="block" />
        <h2 className="m-0 mt-4 text-center text-lg font-bold">{count} selected notes</h2>
        <p className="mt-2 max-w-60 text-center text-sm">Actions will be performed on all selected notes.</p>
        <Button className="mt-2.5" onClick={cancelMultipleSelection}>
          Cancel multiple selection
        </Button>
      </div>
    </div>
  )
}

export default observer(MultipleSelectedNotes)
