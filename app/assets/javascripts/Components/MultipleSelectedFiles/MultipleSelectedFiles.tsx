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
    <div className="flex flex-col h-full items-center">
      <div className="flex items-center justify-between p-4 w-full">
        <h1 className="sk-h1 font-bold m-0">{count} selected files</h1>
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
      <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md">
        <IlNotesIcon className="block" />
        <h2 className="text-lg m-0 text-center mt-4">{count} selected files</h2>
        <p className="text-sm mt-2 text-center max-w-60">Actions will be performed on all selected files.</p>
        <Button className="mt-2.5" onClick={cancelMultipleSelection}>
          Cancel multiple selection
        </Button>
      </div>
    </div>
  )
}

export default observer(MultipleSelectedFiles)
