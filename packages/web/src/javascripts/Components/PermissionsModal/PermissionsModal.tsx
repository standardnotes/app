import { ComponentInterface } from '@standardnotes/snjs'
import { useCallback } from 'react'
import { c } from 'ttag'
import Button from '@/Components/Button/Button'
import ModalDialogButtons from '../Modal/ModalDialogButtons'
import Modal from '../Modal/Modal'

const jtString = (value: unknown): string => (Array.isArray(value) ? value.join('') : String(value))

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
      title={c('B2.NavSharedUI.Title').t`Activate Plugin`}
      close={deny}
      actions={[
        { label: c('B2.NavSharedUI.Action').t`Cancel`, onClick: deny, type: 'cancel', mobileSlot: 'left' },
        {
          label: c('B2.NavSharedUI.Action').t`Continue`,
          onClick: accept,
          type: 'primary',
          mobileSlot: 'right',
        },
      ]}
      customFooter={
        <ModalDialogButtons className="hidden md:flex">
          <Button primary fullWidth onClick={accept} className="block">
            {c('B2.NavSharedUI.Action').t`Continue`}
          </Button>
        </ModalDialogButtons>
      }
    >
      <div className="px-4 py-4">
        <div className="text-base">
          <strong>
            {jtString(
              c('B2.NavSharedUI.Info')
                .jt`${component.displayName} would like to interact with your ${permissionsString}`,
            )}
          </strong>
        </div>
        <div className="sk-panel-row [word-break:break-word]">
          <p className="sk-p">
            {c('B2.NavSharedUI.Info')
              .t`Plugins use an offline messaging system to communicate and can only access the current note.`}
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default PermissionsModal
