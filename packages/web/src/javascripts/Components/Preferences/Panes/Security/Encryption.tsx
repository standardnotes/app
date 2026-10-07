import { StringEncNotEnabled, StringE2EEnabled, StringLocalEncEnabled } from '@/Constants/Strings'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import EncryptionEnabled from './EncryptionEnabled'
import { useApplication } from '@/Components/ApplicationProvider'
import { c } from 'ttag'

const Encryption: FunctionComponent = () => {
  const app = useApplication()

  const hasUser = app.hasAccount()
  const hasPasscode = app.hasPasscode()
  const isEncryptionEnabled = app.isEncryptionAvailable()

  const encryptionStatusString = hasUser
    ? StringE2EEnabled()
    : hasPasscode
    ? StringLocalEncEnabled()
    : StringEncNotEnabled()

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>{c('B6.Preferences.Security.Title').t`Encryption`}</Title>
        <Text>{encryptionStatusString}</Text>

        {isEncryptionEnabled && <EncryptionEnabled />}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Encryption)
