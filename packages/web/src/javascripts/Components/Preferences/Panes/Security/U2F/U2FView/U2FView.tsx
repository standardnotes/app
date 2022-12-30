import { FunctionComponent } from 'react'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
// import { is2FAActivation, U2FAuth } from '../U2FAuth'
import { U2FAuth } from '../U2FAuth'
// import U2FActivationView from '../U2FActivationView'
import U2FTitle from './U2FTitle'
import U2FDescription from './U2FDescription'
import U2FSwitch from './U2FSwitch'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'

type Props = {
  auth: U2FAuth
}

const U2FAuthView: FunctionComponent<Props> = ({ auth }) => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-row items-center">
            <div className="flex flex-grow flex-col">
              <U2FTitle auth={auth} />
              <U2FDescription auth={auth} />
            </div>
            <div className="flex min-w-15 flex-col items-center justify-center">
              <U2FSwitch auth={auth} />
            </div>
          </div>
        </PreferencesSegment>

        {auth.errorMessage != null && (
          <PreferencesSegment>
            <Text className="text-danger">{auth.errorMessage}</Text>
          </PreferencesSegment>
        )}
      </PreferencesGroup>
      {/* {auth.status !== 'fetching' && is2FAActivation(auth.status) && <U2FActivationView activation={auth.status} />} */}
    </>
  )
}

export default observer(U2FAuthView)
