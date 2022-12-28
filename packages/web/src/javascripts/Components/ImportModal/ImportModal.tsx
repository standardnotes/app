import { useReducer } from 'react'
import Button from '../Button/Button'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
import ImportModalAutoDetectPage from './AutoDetectPage'
import ImportModalInitialPage from './InitialPage'
import ImportModalSelectedServicePage from './SelectedServicePage'
import { ImportModalAction, ImportModalState } from './Types'

const reducer = (state: ImportModalState, action: ImportModalAction): ImportModalState => {
  switch (action.type) {
    case 'setFiles':
      return {
        ...state,
        files: action.files.map((file) => ({
          file,
          status: 'pending',
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
        {files.length > 0 && selectedService && (
          <ImportModalSelectedServicePage files={files} selectedService={selectedService} dispatch={dispatch} />
        )}
        {files.length > 0 && !selectedService && <ImportModalAutoDetectPage files={files} />}
      </ModalDialogDescription>
      <ModalDialogButtons>
        {files.some((file) => file.status === 'success') && selectedService && <Button primary>Import</Button>}
        <Button>Cancel</Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default ImportModal
