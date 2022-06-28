import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import { useCallback } from 'react'
import FileOptionsPanel from '../FileContextMenu/FileOptionsPanel'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { WebApplication } from '@/Application/Application'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { FilePreviewModalController } from '@/Controllers/FilePreviewModalController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import AttachedFilesButton from '../AttachedFilesPopover/AttachedFilesButton'

type Props = {
  application: WebApplication
  featuresController: FeaturesController
  filePreviewModalController: FilePreviewModalController
  filesController: FilesController
  navigationController: NavigationController
  notesController: NotesController
  selectionController: SelectedItemsController
}

const MultipleSelectedFiles = ({
  application,
  filesController,
  featuresController,
  filePreviewModalController,
  navigationController,
  notesController,
  selectionController,
}: Props) => {
  const count = selectionController.selectedFilesCount

  const cancelMultipleSelection = useCallback(() => {
    selectionController.cancelMultipleSelection()
  }, [selectionController])

  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between p-4">
        <h1 className="m-0 text-lg font-bold">{count} selected files</h1>
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
          <FileOptionsPanel filesController={filesController} selectionController={selectionController} />
        </div>
      </div>
      <div className="flex w-full max-w-md flex-grow flex-col items-center justify-center">
        <IlNotesIcon className="block" />
        <h2 className="m-0 mt-4 text-center text-lg font-bold">{count} selected files</h2>
        <p className="max-w-60 mt-2 text-center text-sm">Actions will be performed on all selected files.</p>
        <Button className="mt-2.5" onClick={cancelMultipleSelection}>
          Cancel multiple selection
        </Button>
      </div>
    </div>
  )
}

export default observer(MultipleSelectedFiles)
