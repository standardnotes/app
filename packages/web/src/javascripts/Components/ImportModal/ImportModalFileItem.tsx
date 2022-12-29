import { classNames } from '@standardnotes/snjs'
import { Importer, NoteImportType } from '@standardnotes/ui-services'
import { Dispatch, useCallback, useEffect } from 'react'
import Icon from '../Icon/Icon'
import { ImportModalAction, ImportModalFile } from './Types'

const NoteImportTypeColors: Record<NoteImportType, string> = {
  evernote: 'bg-[#14cc45] text-[#000]',
  simplenote: 'bg-[#3360cc] text-default',
  'google-keep': 'bg-[#fbbd00] text-[#000]',
  aegis: 'bg-[#0d47a1] text-default',
  plaintext: 'bg-default border border-border',
}

const NoteImportTypeIcons: Record<NoteImportType, string> = {
  evernote: 'evernote',
  simplenote: 'simplenote',
  'google-keep': 'gkeep',
  aegis: 'aegis',
  plaintext: 'plain-text',
}

export const ImportModalFileItem = ({
  file,
  dispatch,
}: {
  file: ImportModalFile
  dispatch: Dispatch<ImportModalAction>
}) => {
  const setFileService = useCallback(
    (service: NoteImportType | null) => {
      dispatch({
        type: 'updateFile',
        file: {
          ...file,
          service,
          status: service ? 'ready' : 'pending',
        },
      })
    },
    [dispatch, file],
  )

  useEffect(() => {
    const detect = async () => {
      const detectedService = await Importer.detectService(file.file)
      setFileService(detectedService)
    }
    if (file.service === undefined) {
      void detect()
    }
  }, [dispatch, file, setFileService])

  return (
    <div
      className={classNames(
        'flex gap-2 py-2 px-2',
        file.service == null ? 'flex-col items-start md:flex-row md:items-center' : 'items-center',
      )}
    >
      <div className="mr-auto flex items-center">
        {file.service && (
          <div className={classNames('mr-4 rounded p-2', NoteImportTypeColors[file.service])}>
            <Icon type={NoteImportTypeIcons[file.service]} size="medium" />
          </div>
        )}
        <div className="flex flex-col">
          <div>{file.file.name}</div>
          <div className="text-xs opacity-75">
            {file.status === 'ready' && 'Ready to parse.'}
            {file.status === 'pending' && 'Could not auto-detect service. Please select manually.'}
            {file.status === 'parsing' && 'Parsing...'}
            {file.status === 'importing' && 'Importing...'}
            {file.status === 'error' && `${file.error}`}
            {file.status === 'success' && 'Imported successfully!'}
          </div>
        </div>
      </div>
      {file.service == null && (
        <div className="flex items-center">
          <form
            className="flex items-center"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.target as HTMLFormElement
              const service = form.elements[0] as HTMLSelectElement
              setFileService(service.value as NoteImportType)
            }}
          >
            <select className="mr-2 rounded border border-border bg-default px-2 py-1 text-sm">
              <option value="evernote">Evernote</option>
              <option value="simplenote">Simplenote</option>
              <option value="google-keep">Google Keep</option>
              <option value="aegis">Aegis</option>
              <option value="plaintext">Plaintext</option>
            </select>
            <button type="submit" className="rounded border border-border bg-default p-1.5 hover:bg-contrast">
              <Icon type="check" size="medium" />
            </button>
          </form>
          <button
            className="ml-2 rounded border border-border bg-default p-1.5 hover:bg-contrast"
            onClick={() => {
              dispatch({
                type: 'removeFile',
                id: file.id,
              })
            }}
          >
            <Icon type="close" size="medium" />
          </button>
        </div>
      )}
      {file.status === 'success' && <Icon type="check-circle-filled" className="text-success" />}
    </div>
  )
}
