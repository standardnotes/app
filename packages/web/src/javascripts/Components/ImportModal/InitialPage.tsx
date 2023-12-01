import { ImportModalController } from '@/Components/ImportModal/ImportModalController'
import { observer } from 'mobx-react-lite'

type Props = {
  setFiles: ImportModalController['setFiles']
  selectFiles: () => void
}

const ImportModalInitialPage = ({ setFiles, selectFiles }: Props) => {
  return (
    <button
      onClick={() => selectFiles()}
      className="flex min-h-[30vh] w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-info p-2 hover:border-4"
      onDragStart={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer.files)
        setFiles(files)
      }}
    >
      <div className="text-lg font-semibold">Drag and drop files to auto-detect and import</div>
      <div className="text-sm">Or click to open file picker</div>
    </button>
  )
}

export default observer(ImportModalInitialPage)
