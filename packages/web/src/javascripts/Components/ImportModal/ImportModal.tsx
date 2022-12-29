import { UuidGenerator } from '@standardnotes/snjs'
import { useReducer } from 'react'
import Button from '../Button/Button'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
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
    case 'setSelectedService':
      return { ...state, selectedService: action.selectedService }
  }
}

const initialState: ImportModalState = {
  files: [],
  selectedService: undefined,
}

const ImportModal = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { files, selectedService } = state

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
        {!files.length && !selectedService && <ImportModalInitialPage dispatch={dispatch} />}
      </ModalDialogDescription>
      <ModalDialogButtons>
        {files.some((file) => file.status === 'success') && selectedService && <Button primary>Import</Button>}
        <Button>Cancel</Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default ImportModal
