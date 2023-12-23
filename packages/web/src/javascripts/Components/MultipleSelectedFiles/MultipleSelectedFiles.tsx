import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import { useCallback } from 'react'
import FileOptionsPanel from '../FileContextMenu/FileOptionsPanel'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'

type Props = {
  itemListController: ItemListController
}

const MultipleSelectedFiles = ({ itemListController }: Props) => {
  const count = itemListController.selectedFilesCount

  const cancelMultipleSelection = useCallback(() => {
    itemListController.cancelMultipleSelection()
  }, [itemListController])

  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between p-4">
        <h1 className="m-0 text-lg font-bold">{count} selected files</h1>
        <div>
          <FileOptionsPanel itemListController={itemListController} />
        </div>
      </div>
      <div className="flex min-h-full w-full max-w-md flex-grow flex-col items-center justify-center">
        <IlNotesIcon className="block" />
        <h2 className="m-0 mt-4 text-center text-lg font-bold">{count} selected files</h2>
        <p className="mt-2 max-w-60 text-center text-sm">Actions will be performed on all selected files.</p>
        <Button className="mt-2.5" onClick={cancelMultipleSelection}>
          Cancel multiple selection
        </Button>
      </div>
    </div>
  )
}

export default observer(MultipleSelectedFiles)
