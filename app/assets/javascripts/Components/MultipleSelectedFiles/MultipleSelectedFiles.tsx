import { AppState } from '@/UIModels/AppState'
import { IlNotesIcon } from '@standardnotes/icons'
import { observer } from 'mobx-react-lite'
import Button from '../Button/Button'
import { useCallback } from 'react'
import FileOptionsPanel from '../FileContextMenu/FileOptionsPanel'

type Props = {
  appState: AppState
}

const MultipleSelectedFiles = ({ appState }: Props) => {
  const count = appState.files.selectedFilesCount

  const cancelMultipleSelection = useCallback(() => {
    appState.selectedItems.cancelMultipleSelection()
  }, [appState])

  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex items-center justify-between p-4 w-full">
        <h1 className="sk-h1 font-bold m-0">{count} selected files</h1>
        <div className="flex">
          <FileOptionsPanel appState={appState} />
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
