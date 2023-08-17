import { ImportModalController } from '@/Controllers/ImportModalController'
import { ClassicFileReader } from '@standardnotes/filepicker'
import { NoteImportType } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'

type Props = {
  setFiles: ImportModalController['setFiles']
}

const ImportModalInitialPage = ({ setFiles }: Props) => {
  const selectFiles = useCallback(
    async (service?: NoteImportType) => {
      const files = await ClassicFileReader.selectFiles()

      setFiles(files, service)
    },
    [setFiles],
  )

  return (
    <>
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
      <div className="text-center my-4 w-full">or import from:</div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button className="flex items-center !py-2" onClick={() => selectFiles('evernote')}>
          <Icon type="evernote" className="text-[#14cc45] mr-2" />
          Evernote
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('google-keep')}>
          <Icon type="gkeep" className="text-[#fbbd00] mr-2" />
          Google Keep
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('simplenote')}>
          <Icon type="simplenote" className="text-[#3360cc] mr-2" />
          Simplenote
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('aegis')}>
          <Icon type="aegis" className="bg-[#0d47a1] text-[#fff] rounded mr-2 p-1" size="normal" />
          Aegis
        </Button>
        <Button className="flex items-center !py-2" onClick={() => selectFiles('plaintext')}>
          <Icon type="plain-text" className="text-info mr-2" />
          Plaintext / Markdown
        </Button>
        {/* <Button className="flex items-center !py-2" onClick={() => selectFiles('rich-text')}>
          <Icon type="rich-text" className="text-accessory-tint-2 mr-2" />
          HTML
        </Button> */}
        <Button className="flex items-center !py-2" onClick={() => selectFiles('super')}>
          <Icon type="file-doc" className="text-accessory-tint-1 mr-2" />
          Super (JSON)
        </Button>
      </div>
    </>
  )
}

export default observer(ImportModalInitialPage)
