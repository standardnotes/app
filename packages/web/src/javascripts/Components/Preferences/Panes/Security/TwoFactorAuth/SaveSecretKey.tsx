import DecoratedInput from '@/Components/Input/DecoratedInput'
import IconButton from '@/Components/Button/IconButton'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import CopyButton from './CopyButton'
import Bullet from './Bullet'
import { downloadSecretKey } from './download-secret-key'
import { TwoFactorActivation } from './TwoFactorActivation'
import Icon from '@/Components/Icon/Icon'

type Props = {
  activation: TwoFactorActivation
}

const SaveSecretKey: FunctionComponent<Props> = ({ activation: act }) => {
  return (
    <div className="h-33 flex flex-row items-center px-4 py-4">
      <div className="flex flex-grow flex-col">
        <div className="flex flex-row flex-wrap items-center gap-1">
          <Bullet />
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
          <DecoratedInput
            disabled={true}
            right={[
              <CopyButton copyValue={act.secretKey} />,
              <IconButton
                focusable={false}
                title="Download"
                icon="download"
                className="p-0"
                onClick={() => {
                  downloadSecretKey(act.secretKey)
                }}
              />,
            ]}
            value={act.secretKey}
            className={{ container: 'ml-2' }}
          />
        </div>
        <div className="h-2" />
        <div className="flex flex-row items-center">
          <Bullet />
          <div className="min-w-1" />
          <div className="text-sm">
            You can use this key to generate codes if you lose access to your authenticator app.
            <br />
            <a
              target="_blank"
              rel="noreferrer noopener"
              className="underline hover:no-underline"
              href="https://standardnotes.com/help/22/what-happens-if-i-lose-my-2fa-device-and-my-secret-key"
            >
              Learn more
              <Icon className="ml-1 inline" type="open-in" size="small" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(SaveSecretKey)
