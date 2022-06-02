import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import NotesOptionsPanel from '@/Components/NotesOptions/NotesOptionsPanel'
import { WebApplication } from '@/Application/Application'
import PinNoteButton from '@/Components/PinNoteButton/PinNoteButton'
import Button from '../Button/Button'
import { useCallback } from 'react'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const MultipleSelectedNotes = ({ application, viewControllerManager }: Props) => {
  const count = viewControllerManager.notesController.selectedNotesCount

  const cancelMultipleSelection = useCallback(() => {
    viewControllerManager.selectionController.cancelMultipleSelection()
  }, [viewControllerManager])

  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex items-center justify-between p-4 w-full">
        <h1 className="sk-h1 font-bold m-0">{count} selected notes</h1>
        <div className="flex">
          <div className="mr-3">
            <PinNoteButton viewControllerManager={viewControllerManager} />
          </div>
          <NotesOptionsPanel application={application} viewControllerManager={viewControllerManager} />
        </div>
      </div>
      <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md">
        <IlNotesIcon className="block" />
        <h2 className="text-lg m-0 text-center mt-4">{count} selected notes</h2>
        <p className="text-sm mt-2 text-center max-w-60">Actions will be performed on all selected notes.</p>
        <Button className="mt-2.5" onClick={cancelMultipleSelection}>
          Cancel multiple selection
        </Button>
      </div>
    </div>
  )
}

export default observer(MultipleSelectedNotes)
