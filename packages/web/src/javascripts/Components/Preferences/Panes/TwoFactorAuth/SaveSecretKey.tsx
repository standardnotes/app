import Button from '@/Components/Button/Button'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import IconButton from '@/Components/Button/IconButton'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import CopyButton from './CopyButton'
import Bullet from './Bullet'
import { downloadSecretKey } from './download-secret-key'
import { TwoFactorActivation } from './TwoFactorActivation'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'

type Props = {
  activation: TwoFactorActivation
}

const SaveSecretKey: FunctionComponent<Props> = ({ activation: act }) => {
  const download = (
    <IconButton
      focusable={false}
      title="Download"
      icon="download"
      className="p-0"
      onClick={() => {
        downloadSecretKey(act.secretKey)
      }}
    />
  )
  return (
    <ModalDialog>
      <ModalDialogLabel
        closeDialog={() => {
          act.cancelActivation()
        }}
      >
        Step 2 of 3 - Save secret key
      </ModalDialogLabel>
      <ModalDialogDescription className="h-33 flex flex-row items-center">
        <div className="flex flex-grow flex-col">
          <div className="flex flex-row items-center">
            <Bullet />
            <div className="min-w-1" />
            <div className="text-sm">
              <b>Save your secret key</b>{' '}
              <a
                target="_blank"
                href="https://standardnotes.com/help/21/where-should-i-store-my-two-factor-authentication-secret-key"
              >
                somewhere safe
              </a>
              :
            </div>
            <div className="min-w-2" />
            <DecoratedInput
              disabled={true}
              right={[<CopyButton copyValue={act.secretKey} />, download]}
              value={act.secretKey}
            />
          </div>
          <div className="h-2" />
          <div className="flex flex-row items-center">
            <Bullet />
            <div className="min-w-1" />
            <div className="text-sm">
              You can use this key to generate codes if you lose access to your authenticator app.{' '}
              <a
                target="_blank"
                href="https://standardnotes.com/help/22/what-happens-if-i-lose-my-2fa-device-and-my-secret-key"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button className="min-w-20" label="Back" onClick={() => act.openScanQRCode()} />
        <Button className="min-w-20" primary label="Next" onClick={() => act.openVerification()} />
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(SaveSecretKey)
