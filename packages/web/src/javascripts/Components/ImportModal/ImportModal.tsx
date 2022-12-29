import { UuidGenerator } from '@standardnotes/snjs'
import { Importer } from '@standardnotes/ui-services'
import { useCallback, useReducer, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import Button from '../Button/Button'
import { useStateRef } from '../Panes/useStateRef'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
import { ImportModalFileItem } from './ImportModalFileItem'
import ImportModalInitialPage from './InitialPage'
import { ImportModalAction, ImportModalState } from './Types'

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
    case 'clearFiles':
      return {
        ...state,
        files: [],
      }
  }
}

const initialState: ImportModalState = {
  files: [],
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

  const closeDialog = useCallback(() => {
    dispatch({
      type: 'clearFiles',
    })
  }, [])

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeDialog}>Import</ModalDialogLabel>
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
        <Button onClick={closeDialog}>
          {files.length > 0 && files.every((file) => file.status === 'success' || file.status === 'error')
            ? 'Close'
            : 'Cancel'}
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default ImportModal
