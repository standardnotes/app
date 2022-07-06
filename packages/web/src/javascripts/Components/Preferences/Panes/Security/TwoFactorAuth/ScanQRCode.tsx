import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import QRCode from 'qrcode.react'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { TwoFactorActivation } from './TwoFactorActivation'
import AuthAppInfoTooltip from './AuthAppInfoPopup'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import CopyButton from './CopyButton'
import Bullet from './Bullet'

type Props = {
  activation: TwoFactorActivation
}

const ScanQRCode: FunctionComponent<Props> = ({ activation: act }) => {
  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={act.cancelActivation}>Step 1 of 3 - Scan QR code</ModalDialogLabel>
      <ModalDialogDescription className="h-33 flex flex-row items-center">
        <div className="w-25 h-25 flex items-center justify-center bg-info">
          <QRCode className="border-neutral-contrast-bg border-2 border-solid" value={act.qrCode} size={100} />
        </div>
        <div className="min-w-5" />
        <div className="flex flex-grow flex-col gap-2">
          <div className="flex flex-row items-center">
            <Bullet />
            <div className="min-w-1" />
            <div className="text-sm">
              Open your <b>authenticator app</b>.
            </div>
            <div className="min-w-2" />
            <AuthAppInfoTooltip />
          </div>
          <div className="flex flex-row items-center">
            <Bullet className="mt-2 self-start" />
            <div className="min-w-1" />
            <div className="flex-grow text-sm">
              <b>Scan this QR code</b> or <b>add this secret key</b>:
            </div>
          </div>
          <DecoratedInput
            className={{ container: 'w-92 ml-4' }}
            disabled={true}
            value={act.secretKey}
            right={[<CopyButton copyValue={act.secretKey} />]}
          />
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button className="min-w-20" label="Cancel" onClick={() => act.cancelActivation()} />
        <Button className="min-w-20" primary label="Next" onClick={() => act.openSaveSecretKey()} />
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(ScanQRCode)
