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
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'

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
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between p-4">
        <h1 className="m-0 text-lg font-bold">{count} selected notes</h1>
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
      <div className="flex min-h-screen w-full max-w-md flex-grow flex-col items-center justify-center md:min-h-0">
        <IlNotesIcon className="block" />
        <h2 className="m-0 mt-4 text-center text-lg font-bold">{count} selected notes</h2>
        <p className="max-w-60 mt-2 text-center text-sm">Actions will be performed on all selected notes.</p>
        <Button className="mt-2.5" onClick={cancelMultipleSelection}>
          Cancel multiple selection
        </Button>
      </div>
    </div>
  )
}

export default observer(MultipleSelectedNotes)
