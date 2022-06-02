import { FunctionComponent } from 'react'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { is2FAActivation, TwoFactorAuth } from '../TwoFactorAuth'
import TwoFactorActivationView from '../TwoFactorActivationView'
import TwoFactorTitle from './TwoFactorTitle'
import TwoFactorDescription from './TwoFactorDescription'
import TwoFactorSwitch from './TwoFactorSwitch'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'

type Props = {
  auth: TwoFactorAuth
}

const TwoFactorAuthView: FunctionComponent<Props> = ({ auth }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-row items-center">
            <div className="flex-grow flex flex-col">
              <TwoFactorTitle auth={auth} />
              <TwoFactorDescription auth={auth} />
            </div>
            <div className="flex flex-col justify-center items-center min-w-15">
              <TwoFactorSwitch auth={auth} />
            </div>
          </div>
        </PreferencesSegment>

        {auth.errorMessage != null && (
          <PreferencesSegment>
            <Text className="color-danger">{auth.errorMessage}</Text>
          </PreferencesSegment>
        )}
      </PreferencesGroup>
      {auth.status !== 'fetching' && is2FAActivation(auth.status) && (
        <TwoFactorActivationView activation={auth.status} />
      )}
    </>
  )
}

export default observer(TwoFactorAuthView)
