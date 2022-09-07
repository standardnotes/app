import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import { useCallback } from 'react'
import FileOptionsPanel from '../FileContextMenu/FileOptionsPanel'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'

type Props = {
  filesController: FilesController
  selectionController: SelectedItemsController
}

const MultipleSelectedFiles = ({ filesController, selectionController }: Props) => {
  const count = selectionController.selectedFilesCount

  const cancelMultipleSelection = useCallback(() => {
    selectionController.cancelMultipleSelection()
  }, [selectionController])

  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between p-4">
        <h1 className="m-0 text-lg font-bold">{count} selected files</h1>
        <div>
          <FileOptionsPanel filesController={filesController} selectionController={selectionController} />
        </div>
      </div>
      <div className="flex min-h-screen w-full max-w-md flex-grow flex-col items-center justify-center md:min-h-0">
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
