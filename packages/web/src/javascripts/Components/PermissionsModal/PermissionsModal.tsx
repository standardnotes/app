import { SNComponent } from '@standardnotes/snjs'
import { useCallback } from 'react'
import Button from '@/Components/Button/Button'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import Modal from '../Shared/Modal'

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
    <Modal
      title="Activate Component"
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
      className={{ content: 'md:!w-[350px]' }}
      customFooter={
        <div className="hidden md:block">
          <ModalDialogButtons>
            <Button primary fullWidth onClick={accept} className="block">
              Continue
            </Button>
          </ModalDialogButtons>
        </div>
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
            Components use an offline messaging system to communicate. Learn more at{' '}
            <a href="https://standardnotes.com/permissions" rel="noopener" target="_blank" className="sk-a info">
              https://standardnotes.com/permissions.
            </a>
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default PermissionsModal
