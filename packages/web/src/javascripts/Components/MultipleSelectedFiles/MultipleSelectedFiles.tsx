import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import { useCallback } from 'react'
import { c } from 'ttag'
import FileOptionsPanel from '../FileContextMenu/FileOptionsPanel'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'

const jtString = (value: unknown): string => (Array.isArray(value) ? value.join('') : String(value))

type Props = {
  itemListController: ItemListController
}

const MultipleSelectedFiles = ({ itemListController }: Props) => {
  const count = itemListController.selectedFilesCount
  const selectedFilesLabel = jtString(c('B7.FilesSubscriptionHelp.Files.Info').jt`${count} selected files`)

  const cancelMultipleSelection = useCallback(() => {
    itemListController.cancelMultipleSelection()
  }, [itemListController])

  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex w-full items-center justify-between p-4">
        <h1 className="m-0 text-lg font-bold">{selectedFilesLabel}</h1>
        <div>
          <FileOptionsPanel itemListController={itemListController} />
        </div>
      </div>
      <div className="flex min-h-full w-full max-w-md flex-grow flex-col items-center justify-center">
        <IlNotesIcon className="block" />
        <h2 className="m-0 mt-4 text-center text-lg font-bold">{selectedFilesLabel}</h2>
        <p className="mt-2 max-w-60 text-center text-sm">
          {c('B7.FilesSubscriptionHelp.Files.Info').t`Actions will be performed on all selected files.`}
        </p>
        <Button className="mt-2.5" onClick={cancelMultipleSelection}>
          {c('B7.FilesSubscriptionHelp.Files.Action').t`Cancel multiple selection`}
        </Button>
      </div>
    </div>
  )
}

export default observer(MultipleSelectedFiles)
