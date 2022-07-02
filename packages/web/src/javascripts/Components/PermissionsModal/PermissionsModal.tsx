import { SNComponent } from '@standardnotes/snjs'
import { useCallback } from 'react'
import Button from '@/Components/Button/Button'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogButtons from '../Shared/ModalDialogButtons'

type Props = {
  callback: (approved: boolean) => void
  dismiss: () => void
  component: SNComponent
  permissionsString: string
}

const PermissionsModal = ({ callback, component, dismiss, permissionsString }: Props) => {
  const accept = useCallback(() => {
    callback(true)
    dismiss()
  }, [callback, dismiss])

  const deny = useCallback(() => {
    callback(false)
    dismiss()
  }, [callback, dismiss])

  return (
    <ModalDialog className="!w-[350px]">
      <ModalDialogLabel closeDialog={deny}>Activate Component</ModalDialogLabel>
      <ModalDialogDescription>
        <div className="text-base">
          <strong>{component.displayName}</strong>
          {' would like to interact with your '}
          {permissionsString}
        </div>
        <div className="sk-panel-row">
          <p className="sk-p">
            Components use an offline messaging system to communicate. Learn more at{' '}
            <a href="https://standardnotes.com/permissions" rel="noopener" target="_blank" className="sk-a info">
              https://standardnotes.com/permissions.
            </a>
          </p>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button primary fullWidth onClick={accept} className="block">
          Continue
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default PermissionsModal
