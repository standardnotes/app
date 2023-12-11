import { ImportModalController, ImportModalFile } from '@/Components/ImportModal/ImportModalController'
import { classNames, ContentType, pluralize } from '@standardnotes/snjs'
import { ConversionResult, Importer } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import Icon from '../Icon/Icon'
import { Disclosure, DisclosureContent, DisclosureProvider } from '@ariakit/react'

const NoteImportTypeColors: Record<string, string> = {
  evernote: 'bg-[#14cc45] text-[#000]',
  simplenote: 'bg-[#3360cc] text-default',
  'google-keep': 'bg-[#fbbd00] text-[#000]',
  aegis: 'bg-[#0d47a1] text-default',
  plaintext: 'bg-default border border-border',
  html: 'bg-accessory-tint-2',
  super: 'bg-accessory-tint-1 text-accessory-tint-1',
}

const NoteImportTypeIcons: Record<string, string> = {
  evernote: 'evernote',
  simplenote: 'simplenote',
  'google-keep': 'gkeep',
  aegis: 'aegis',
  plaintext: 'plain-text',
  html: 'rich-text',
  super: 'file-doc',
}

const countSuccessfulItemsByGroup = (successful: ConversionResult['successful']) => {
  let notes = 0
  let tags = 0
  let files = 0

  for (const item of successful) {
    if (item.content_type === ContentType.TYPES.Note) {
      notes++
    } else if (item.content_type === ContentType.TYPES.Tag) {
      tags++
    } else if (item.content_type === ContentType.TYPES.File) {
      files++
    }
  }

  return {
    notes,
    tags,
    files,
  }
}

const ImportErroredAccordion = ({ errored }: { errored: ConversionResult['errored'] }) => {
  return (
    <DisclosureProvider>
      <Disclosure>
        <div className="flex items-center gap-1">
          <Icon type="warning" className="flex-shrink-0 text-danger" size="small" />
          Could not import {errored.length} {pluralize(errored.length, 'item', 'items')} (click for details)
        </div>
      </Disclosure>
      <DisclosureContent className="w-full overflow-hidden pl-5">
        {errored.map((item, index) => (
          <div className="flex w-full items-center gap-1 overflow-hidden" key={index}>
            <span>{index + 1}.</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">{item.name}:</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{item.error.message}</span>
          </div>
        ))}
      </DisclosureContent>
    </DisclosureProvider>
  )
}

const ImportFinishedStatus = ({ file }: { file: ImportModalFile }) => {
  if (file.status !== 'finished') {
    return null
  }

  const { notes, tags, files } = countSuccessfulItemsByGroup(file.successful)

  const notesStatus = notes > 0 ? `${notes} ${pluralize(notes, 'note', 'notes')}` : ''
  const tagsStatus = tags > 0 ? `${tags} ${pluralize(tags, 'tag', 'tags')}` : ''
  const filesStatus = files > 0 ? `${files} ${pluralize(files, 'file', 'files')}` : ''
  const status = [notesStatus, tagsStatus, filesStatus].filter(Boolean).join(', ')

  return (
    <>
      {file.successful.length > 0 && (
        <div className="flex items-center gap-1">
          <Icon type="check-circle-filled" className="flex-shrink-0 text-success" size="small" />
          <span>{status} imported</span>
        </div>
      )}
      {file.errored.length > 0 && <ImportErroredAccordion errored={file.errored} />}
    </>
  )
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
  const [isDetectingService, setIsDetectingService] = useState(false)
  const [changingService, setChangingService] = useState(false)

  const setFileService = useCallback(
    async (service: string | null) => {
      if (!service) {
        setChangingService(true)
      }
      updateFile({
        ...file,
        service,
        status: 'pending',
      })
    },
    [file, updateFile],
  )

  useEffect(() => {
    const detect = async () => {
      setIsDetectingService(true)
      const detectedService = await importer.detectService(file.file)
      void setFileService(detectedService)
      setIsDetectingService(false)
    }
    if (file.service === undefined) {
      void detect()
    }
  }, [file, importer, setFileService])

  return (
    <div
      className={classNames(
        'flex gap-2 overflow-hidden px-2 py-2.5',
        file.service == null ? 'flex-col items-start md:flex-row md:items-center' : 'items-center',
      )}
    >
      <div className="mr-auto flex w-full items-center">
        {file.service && (
          <div className={classNames('mr-4 rounded p-2', NoteImportTypeColors[file.service])}>
            <Icon type={NoteImportTypeIcons[file.service]} size="medium" />
          </div>
        )}
        <div className="flex w-full flex-col overflow-hidden">
          <div>{file.file.name}</div>
          {isDetectingService ? (
            <div className="text-xs opacity-75">Detecting service...</div>
          ) : (
            <div className={classNames(file.status !== 'finished' && 'line-clamp-3', 'w-full text-xs opacity-75')}>
              {file.status === 'pending' && file.service && 'Ready to import'}
              {file.status === 'pending' && !file.service && 'Could not auto-detect service. Please select manually.'}
              {file.status === 'parsing' && 'Parsing...'}
              {file.status === 'importing' && 'Importing...'}
              {file.status === 'uploading-files' && 'Uploading and embedding files...'}
              {file.status === 'error' && file.error.message}
              <ImportFinishedStatus file={file} />
            </div>
          )}
        </div>
      </div>
      {file.status === 'pending' && (
        <div className="flex items-center">
          {changingService ? (
            <>
              <form
                className="flex items-center"
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = event.target as HTMLFormElement
                  const service = form.elements[0] as HTMLSelectElement
                  void setFileService(service.value)
                  setChangingService(false)
                }}
              >
                <select
                  className="mr-2 rounded border border-border bg-default px-2 py-1 text-sm"
                  defaultValue={file.service ? file.service : undefined}
                >
                  <option value="evernote">Evernote</option>
                  <option value="simplenote">Simplenote</option>
                  <option value="google-keep">Google Keep</option>
                  <option value="aegis">Aegis</option>
                  <option value="plaintext">Plaintext</option>
                  <option value="html">HTML</option>
                  <option value="super">Super</option>
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
              <Icon type="settings" size="medium" />
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
      {file.status === 'finished' && file.successful.length > 0 && file.errored.length === 0 && (
        <Icon type="check-circle-filled" className="flex-shrink-0 text-success" />
      )}
      {file.status === 'error' && <Icon type="warning" className="flex-shrink-0 text-danger" />}
    </div>
  )
}

export default observer(ImportModalFileItem)
