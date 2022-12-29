import { classNames, UuidGenerator } from '@standardnotes/snjs'
import { Importer, NoteImportType } from '@standardnotes/ui-services'
import { Dispatch, useCallback, useEffect, useReducer, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import { useStateRef } from '../Panes/useStateRef'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
import ImportModalInitialPage from './InitialPage'
import { ImportModalAction, ImportModalFile, ImportModalState } from './Types'

const ServiceColors: Record<NoteImportType, string> = {
  evernote: 'bg-[#14cc45] text-[#000]',
  simplenote: 'bg-[#3360cc] text-default',
  'google-keep': 'bg-[#fbbd00] text-[#000]',
  aegis: 'bg-[#0d47a1] text-default',
  plaintext: 'bg-default border border-border',
}

const ServiceIcons: Record<NoteImportType, string> = {
  evernote: 'evernote',
  simplenote: 'simplenote',
  'google-keep': 'gkeep',
  aegis: 'aegis',
  plaintext: 'plain-text',
}

const reducer = (state: ImportModalState, action: ImportModalAction): ImportModalState => {
  switch (action.type) {
    case 'setFiles':
      return {
        ...state,
        files: action.files.map((file) => ({
          id: UuidGenerator.GenerateUuid(),
          file,
          status: action.service ? 'ready' : 'pending',
          service: action.service,
        })),
      }
    case 'updateFile':
      return {
        ...state,
        files: state.files.map((file) => {
          if (file.file.name === action.file.file.name) {
            return action.file
          }
          return file
        }),
      }
    case 'removeFile':
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.id),
      }
  }
}

const initialState: ImportModalState = {
  files: [],
}

const ImportModalFileItem = ({ file, dispatch }: { file: ImportModalFile; dispatch: Dispatch<ImportModalAction> }) => {
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
    <div className="flex items-center py-2 px-2">
      {file.service && (
        <div className={classNames('mr-4 rounded p-2', ServiceColors[file.service])}>
          <Icon type={ServiceIcons[file.service]} size="medium" />
        </div>
      )}
      <div className="mr-auto flex flex-col">
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
      {file.service == null && (
        <>
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
        </>
      )}
      {file.status === 'success' && <Icon type="check-circle-filled" className="text-success" />}
    </div>
  )
}

const ImportModal = () => {
  const application = useApplication()
  const [importer] = useState(() => new Importer(application))
  const [state, dispatch] = useReducer(reducer, initialState)
  const { files } = state
  const filesRef = useStateRef(files)

  const parseAndImport = useCallback(async () => {
    const files = filesRef.current
    if (files.length === 0) {
      return
    }
    for (const file of files) {
      if (!file.service) {
        return
      }

      dispatch({
        type: 'updateFile',
        file: {
          ...file,
          status: 'parsing',
        },
      })

      void importer
        .getPayloadsFromFile(file.file, file.service)
        .then(async (payloads) => {
          dispatch({
            type: 'updateFile',
            file: {
              ...file,
              status: 'importing',
            },
          })

          try {
            await importer.importFromTransferPayloads(payloads)
            dispatch({
              type: 'updateFile',
              file: {
                ...file,
                status: 'success',
              },
            })
          } catch (error) {
            dispatch({
              type: 'updateFile',
              file: {
                ...file,
                status: 'error',
                error: error instanceof Error ? error : new Error('Could not import file'),
              },
            })
          }
        })
        .catch((error) => {
          dispatch({
            type: 'updateFile',
            file: {
              ...file,
              status: 'error',
              error,
            },
          })
        })
    }
  }, [filesRef, importer])

  return (
    <ModalDialog>
      <ModalDialogLabel
        closeDialog={function (): void {
          //
        }}
      >
        Import
      </ModalDialogLabel>
      <ModalDialogDescription>
        {!files.length && <ImportModalInitialPage dispatch={dispatch} />}
        {files.length > 0 && (
          <div className="divide-y divide-border">
            {files.map((file) => (
              <ImportModalFileItem file={file} key={file.id} dispatch={dispatch} />
            ))}
          </div>
        )}
      </ModalDialogDescription>
      <ModalDialogButtons>
        {files.length > 0 && files.every((file) => file.status === 'ready') && (
          <Button primary onClick={parseAndImport}>
            Parse & import
          </Button>
        )}
        <Button>
          {files.length > 0 && files.every((file) => file.status === 'success' || file.status === 'error')
            ? 'Close'
            : 'Cancel'}
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default ImportModal
