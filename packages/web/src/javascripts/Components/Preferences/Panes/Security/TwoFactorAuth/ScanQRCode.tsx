import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'
import QRCode from 'qrcode.react'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { TwoFactorActivation } from './TwoFactorActivation'
import AuthAppInfoTooltip from './AuthAppInfoPopup'
import CopyButton from './CopyButton'
import Bullet from './Bullet'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

type Props = {
  activation: TwoFactorActivation
}

const ScanQRCode: FunctionComponent<Props> = ({ activation: act }) => {
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return (
    <div className="h-33 flex flex-col items-center gap-5 px-4 py-4 md:flex-row">
      <div className="flex items-center justify-center bg-info">
        <QRCode
          className="border-2 border-solid border-neutral-contrast"
          value={act.qrCode}
          size={isMobileScreen ? 200 : 150}
        />
      </div>
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
    </div>
  )
}

export default observer(ScanQRCode)
