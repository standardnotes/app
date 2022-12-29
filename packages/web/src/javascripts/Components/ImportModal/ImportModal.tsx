import { classNames, UuidGenerator } from '@standardnotes/snjs'
import { Importer, NoteImportType } from '@standardnotes/ui-services'
import { Dispatch, useEffect, useReducer } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
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
  plaintext: 'bg-[#fbbd00] text-[#000]',
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
          status: 'pending',
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
  }
}

const initialState: ImportModalState = {
  files: [],
}

const ImportModalFileItem = ({ file, dispatch }: { file: ImportModalFile; dispatch: Dispatch<ImportModalAction> }) => {
  useEffect(() => {
    const detect = async () => {
      const detectedService = await Importer.detectService(file.file)
      dispatch({
        type: 'updateFile',
        file: {
          ...file,
          service: detectedService,
        },
      })
    }
    if (file.service == undefined) {
      void detect()
    }
  }, [dispatch, file])

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
          {file.service
            ? 'Detected service. Ready to parse.'
            : file.service == null
            ? 'Could not auto-detect service. Please select manually.'
            : 'Detecting service...'}
        </div>
      </div>
      {file.service == null && (
        <select className="rounded border border-border px-2 py-1">
          <option value="evernote">Evernote</option>
          <option value="simplenote">Simplenote</option>
          <option value="google-keep">Google Keep</option>
          <option value="aegis">Aegis</option>
          <option value="plaintext">Plaintext</option>
        </select>
      )}
    </div>
  )
}

const ImportModal = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { files } = state

  console.log(files)

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
        {files.some((file) => file.status === 'success') && <Button primary>Import</Button>}
        <Button>Cancel</Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default ImportModal
