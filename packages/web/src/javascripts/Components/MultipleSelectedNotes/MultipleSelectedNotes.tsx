import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import NotesOptionsPanel from '@/Components/NotesOptions/NotesOptionsPanel'
import { WebApplication } from '@/Application/Application'
import PinNoteButton from '@/Components/PinNoteButton/PinNoteButton'
import Button from '../Button/Button'
import { useCallback } from 'react'
import AttachedFilesButton from '../AttachedFilesPopover/AttachedFilesButton'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { FilePreviewModalController } from '@/Controllers/FilePreviewModalController'
import { FilesController } from '@/Controllers/FilesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { HistoryModalController } from '@/Controllers/HistoryModalController'

type Props = {
  application: WebApplication
  featuresController: FeaturesController
  filePreviewModalController: FilePreviewModalController
  filesController: FilesController
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
  selectionController: SelectedItemsController
  historyModalController: HistoryModalController
}

const MultipleSelectedNotes = ({
  application,
  featuresController,
  filePreviewModalController,
  filesController,
  navigationController,
  notesController,
  noteTagsController,
  selectionController,
  historyModalController,
}: Props) => {
  const count = notesController.selectedNotesCount

  const cancelMultipleSelection = useCallback(() => {
    selectionController.cancelMultipleSelection()
  }, [selectionController])

  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex items-center justify-between p-4 w-full">
        <h1 className="sk-h1 font-bold m-0">{count} selected notes</h1>
        <div className="flex">
          <div className="mr-3">
            <AttachedFilesButton
              application={application}
              featuresController={featuresController}
              filePreviewModalController={filePreviewModalController}
              filesController={filesController}
              navigationController={navigationController}
              notesController={notesController}
              selectionController={selectionController}
            />
          </div>
          <div className="mr-3">
            <PinNoteButton notesController={notesController} />
          </div>
          <NotesOptionsPanel
            application={application}
            navigationController={navigationController}
            notesController={notesController}
            noteTagsController={noteTagsController}
            historyModalController={historyModalController}
          />
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
