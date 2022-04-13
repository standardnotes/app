import { Button } from '@/Components/Button/Button'
import { DecoratedInput } from '@/Components/Input/DecoratedInput'
import { IconButton } from '@/Components/Button/IconButton'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { CopyButton } from './CopyButton'
import { Bullet } from './Bullet'
import { downloadSecretKey } from './download-secret-key'
import { TwoFactorActivation } from './TwoFactorActivation'
import {
  ModalDialog,
  ModalDialogButtons,
  ModalDialogDescription,
  ModalDialogLabel,
} from '@/Components/Shared/ModalDialog'

export const SaveSecretKey: FunctionComponent<{
  activation: TwoFactorActivation
}> = observer(({ activation: act }) => {
  const download = (
    <IconButton
      focusable={false}
      title="Download"
      icon="download"
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
      <ModalDialogDescription className="h-33">
        <div className="flex-grow flex flex-col">
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
        <Button
          className="min-w-20"
          variant="normal"
          label="Back"
          onClick={() => act.openScanQRCode()}
        />
        <Button
          className="min-w-20"
          variant="primary"
          label="Next"
          onClick={() => act.openVerification()}
        />
      </ModalDialogButtons>
    </ModalDialog>
  )
})
