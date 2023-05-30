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
      <div className="relative mt-6 mb-6 w-full">
        <hr className="w-full border-border" />
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-default p-1">
          or import from:
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          className="flex items-center bg-[#14cc45] !py-2 text-[#000]"
          primary
          onClick={() => selectFiles('evernote')}
        >
          <Icon type="evernote" className="mr-2" />
          Evernote
        </Button>
        <Button
          className="flex items-center bg-[#fbbd00] !py-2 text-[#000]"
          primary
          onClick={() => selectFiles('google-keep')}
        >
          <Icon type="gkeep" className="mr-2" />
          Google Keep
        </Button>
        <Button className="flex items-center bg-[#3360cc] !py-2" primary onClick={() => selectFiles('simplenote')}>
          <Icon type="simplenote" className="mr-2" />
          Simplenote
        </Button>
        <Button className="flex items-center bg-[#0d47a1] !py-2" primary onClick={() => selectFiles('aegis')}>
          <Icon type="aegis" className="mr-2" />
          Aegis Authenticator
        </Button>
        <Button className="flex items-center bg-info !py-2" onClick={() => selectFiles('plaintext')} primary>
          <Icon type="plain-text" className="mr-2" />
          Plaintext
        </Button>
        <Button
          className="flex items-center bg-accessory-tint-4 !py-2"
          primary
          onClick={() => selectFiles('plaintext')}
        >
          <Icon type="markdown" className="mr-2" />
          Markdown
        </Button>
      </div>
    </>
  )
}

export default observer(ImportModalInitialPage)
