import { ComponentInterface } from '@standardnotes/snjs'
import { useCallback } from 'react'
import Button from '@/Components/Button/Button'
import ModalDialogButtons from '../Modal/ModalDialogButtons'
import Modal from '../Modal/Modal'

type Props = {
  callback: (approved: boolean) => void
  dismiss: () => void
  component: ComponentInterface
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
    <Modal
      title="Activate Plugin"
      close={deny}
      actions={[
        { label: 'Cancel', onClick: deny, type: 'cancel', mobileSlot: 'left' },
        {
          label: 'Continue',
          onClick: accept,
          type: 'primary',
          mobileSlot: 'right',
        },
      ]}
      customFooter={
        <ModalDialogButtons className="hidden md:flex">
          <Button primary fullWidth onClick={accept} className="block">
            Continue
          </Button>
        </ModalDialogButtons>
      }
    >
      <div className="px-4 py-4">
        <div className="text-base">
          <strong>{component.displayName}</strong>
          {' would like to interact with your '}
          {permissionsString}
        </div>
        <div className="sk-panel-row [word-break:break-word]">
          <p className="sk-p">
            Plugins use an offline messaging system to communicate and can only access the current note.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default PermissionsModal
