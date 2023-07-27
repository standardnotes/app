import { ImportModalController, ImportModalFile } from '@/Controllers/ImportModalController'
import { classNames, ContentType, DecryptedTransferPayload, pluralize } from '@standardnotes/snjs'
import { Importer, NoteImportType } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect } from 'react'
import Icon from '../Icon/Icon'

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

const ImportModalFileItem = ({
  file,
  updateFile,
  removeFile,
  importer,
}: {
  file: ImportModalFile
  updateFile: ImportModalController['updateFile']
  removeFile: ImportModalController['removeFile']
  importer: Importer
}) => {
  const setFileService = useCallback(
    async (service: NoteImportType | null) => {
      let payloads: DecryptedTransferPayload[] | undefined
      try {
        payloads = service ? await importer.getPayloadsFromFile(file.file, service) : undefined
      } catch (error) {
        console.error(error)
      }

      updateFile({
        ...file,
        service,
        status: service ? 'ready' : 'pending',
        payloads,
      })
    },
    [file, importer, updateFile],
  )

  useEffect(() => {
    const detect = async () => {
      const detectedService = await Importer.detectService(file.file)
      void setFileService(detectedService)
    }
    if (file.service === undefined) {
      void detect()
    }
  }, [file, setFileService])

  const notePayloads =
    file.status === 'ready' && file.payloads
      ? file.payloads.filter((payload) => payload.content_type === ContentType.TYPES.Note)
      : []
  const tagPayloads =
    file.status === 'ready' && file.payloads
      ? file.payloads.filter((payload) => payload.content_type === ContentType.TYPES.Tag)
      : []

  const payloadsImportMessage =
    `Ready to import ${notePayloads.length} ` +
    pluralize(notePayloads.length, 'note', 'notes') +
    (tagPayloads.length > 0 ? ` and ${tagPayloads.length} ${pluralize(tagPayloads.length, 'tag', 'tags')}` : '')

  return (
    <div
      className={classNames(
        'flex gap-2 px-2 py-2',
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
            {file.status === 'ready'
              ? notePayloads.length > 1 || tagPayloads.length
                ? payloadsImportMessage
                : 'Ready to import'
              : null}
            {file.status === 'pending' && 'Could not auto-detect service. Please select manually.'}
            {file.status === 'parsing' && 'Parsing...'}
            {file.status === 'importing' && 'Importing...'}
            {file.status === 'error' && JSON.stringify(file.error)}
            {file.status === 'success' && file.successMessage}
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
              void setFileService(service.value as NoteImportType)
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
              removeFile(file.id)
            }}
          >
            <Icon type="close" size="medium" />
          </button>
        </div>
      )}
      {file.status === 'success' && <Icon type="check-circle-filled" className="text-success" />}
      {file.status === 'error' && <Icon type="warning" className="text-danger" />}
    </div>
  )
}

export default observer(ImportModalFileItem)
