import { FunctionComponent } from 'react'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { is2FAActivation, is2FAEnabled, TwoFactorAuth } from '../TwoFactorAuth'
import TwoFactorActivationView from '../TwoFactorActivationView'
import TwoFactorTitle from './TwoFactorTitle'
import TwoFactorDescription from './TwoFactorDescription'
import TwoFactorSwitch from './TwoFactorSwitch'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/Application'
import RecoveryCodeBanner from '@/Components/RecoveryCodeBanner/RecoveryCodeBanner'

type Props = {
  auth: TwoFactorAuth
  application: WebApplication
}

const TwoFactorAuthView: FunctionComponent<Props> = ({ auth, application }) => {
  const canShowActivationModal = auth.status !== 'fetching' && is2FAActivation(auth.status)
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-row items-center">
            <div className="flex flex-grow flex-col">
              <TwoFactorTitle auth={auth} />
              <TwoFactorDescription auth={auth} />
            </div>
            <div className="flex min-w-15 flex-col items-center justify-center">
              <TwoFactorSwitch auth={auth} />
            </div>
          </div>
        </PreferencesSegment>

        {auth.errorMessage != null && (
          <PreferencesSegment>
            <Text className="text-danger">{auth.errorMessage}</Text>
          </PreferencesSegment>
        )}
        {auth.status !== 'fetching' && is2FAEnabled(auth.status) && (
          <PreferencesSegment>
            <div className="mt-3">
              <RecoveryCodeBanner application={application} />
            </div>
          </PreferencesSegment>
        )}
      </PreferencesGroup>
      {canShowActivationModal && <TwoFactorActivationView isOpen={canShowActivationModal} activation={auth.status} />}
    </>
  )
}

export default observer(TwoFactorAuthView)
