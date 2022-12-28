import { useState } from 'react'
import Button from '../Button/Button'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
import ImportModalInitialPage from './ImportModalInitialPage'

type AvailableServices = 'evernote' | 'google-keep' | 'simplenote' | 'aegis'

type Props = {}

const ImportModal = (props: Props) => {
  const [files, setFiles] = useState<File[]>([])
  const [selectedService, setSelectedService] = useState<AvailableServices>()

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
        {!files.length && !selectedService && <ImportModalInitialPage />}
        //
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button>Cancel</Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default ImportModal
