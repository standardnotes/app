import { ImportModalController, ImportModalFile } from '@/Components/ImportModal/ImportModalController'
import { classNames, ContentType, pluralize } from '@standardnotes/snjs'
import { Importer, NoteImportType } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import Icon from '../Icon/Icon'

const NoteImportTypeColors: Record<NoteImportType, string> = {
  evernote: 'bg-[#14cc45] text-[#000]',
  simplenote: 'bg-[#3360cc] text-default',
  'google-keep': 'bg-[#fbbd00] text-[#000]',
  aegis: 'bg-[#0d47a1] text-default',
  plaintext: 'bg-default border border-border',
  html: 'bg-accessory-tint-2',
  super: 'bg-accessory-tint-1 text-accessory-tint-1',
}

const NoteImportTypeIcons: Record<NoteImportType, string> = {
  evernote: 'evernote',
  simplenote: 'simplenote',
  'google-keep': 'gkeep',
  aegis: 'aegis',
  plaintext: 'plain-text',
  html: 'rich-text',
  super: 'file-doc',
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
  const [changingService, setChangingService] = useState(false)

  const setFileService = useCallback(
    async (service: NoteImportType | null) => {
      if (!service) {
        setChangingService(true)
      }
      updateFile({
        ...file,
        service,
        status: service ? 'ready' : 'pending',
      })
    },
    [file, updateFile],
  )

  useEffect(() => {
    const detect = async () => {
      const detectedService = await importer.detectService(file.file)
      void setFileService(detectedService)
    }
    if (file.service === undefined) {
      void detect()
    }
  }, [file, importer, setFileService])

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
        'flex gap-2 px-2 py-2.5',
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
          <div className="line-clamp-3 text-xs opacity-75">
            {file.status === 'ready'
              ? notePayloads.length > 1 || tagPayloads.length
                ? payloadsImportMessage
                : 'Ready to import'
              : null}
            {file.status === 'pending' && !file.service && 'Could not auto-detect service. Please select manually.'}
            {file.status === 'parsing' && 'Parsing...'}
            {file.status === 'importing' && 'Importing...'}
            {file.status === 'uploading-files' && 'Uploading and embedding files...'}
            {file.status === 'error' && file.error.message}
            {file.status === 'success' && file.successMessage}
          </div>
        </div>
      </div>
      {(file.status === 'ready' || file.status === 'pending') && (
        <div className="flex items-center">
          {changingService ? (
            <>
              <form
                className="flex items-center"
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = event.target as HTMLFormElement
                  const service = form.elements[0] as HTMLSelectElement
                  void setFileService(service.value as NoteImportType)
                  setChangingService(false)
                }}
              >
                <select className="mr-2 rounded border border-border bg-default px-2 py-1 text-sm">
                  <option value="evernote">Evernote</option>
                  <option value="simplenote">Simplenote</option>
                  <option value="google-keep">Google Keep</option>
                  <option value="aegis">Aegis</option>
                  <option value="plaintext">Plaintext</option>
                </select>
                <button
                  aria-label="Choose service"
                  type="submit"
                  className="rounded border border-border bg-default p-1.5 hover:bg-contrast"
                >
                  <Icon type="check" size="medium" />
                </button>
              </form>
              <button
                aria-label="Cancel"
                className="ml-2 rounded border border-border bg-default p-1.5 hover:bg-contrast"
                onClick={() => {
                  setChangingService(false)
                }}
              >
                <Icon type="close" size="medium" />
              </button>
            </>
          ) : (
            <button
              aria-label="Change service"
              className="rounded border border-border bg-default p-1.5 hover:bg-contrast"
              onClick={() => {
                setChangingService(true)
              }}
            >
              <Icon type="pencil" size="medium" />
            </button>
          )}
          <button
            aria-label="Remove"
            className="ml-2 rounded border border-border bg-default p-1.5 hover:bg-contrast"
            onClick={() => {
              removeFile(file.id)
            }}
          >
            <Icon type="trash" size="medium" />
          </button>
        </div>
      )}
      {file.status === 'success' && <Icon type="check-circle-filled" className="flex-shrink-0 text-success" />}
      {file.status === 'error' && <Icon type="warning" className="flex-shrink-0 text-danger" />}
    </div>
  )
}

export default observer(ImportModalFileItem)
