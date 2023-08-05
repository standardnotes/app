import { STRING_E2E_ENABLED, STRING_ENC_NOT_ENABLED, STRING_LOCAL_ENC_ENABLED } from '@/Constants/Strings'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import EncryptionEnabled from './EncryptionEnabled'
import { useApplication } from '@/Components/ApplicationProvider'

const Encryption: FunctionComponent = () => {
  const app = useApplication()

  const hasUser = app.hasAccount()
  const hasPasscode = app.hasPasscode()
  const isEncryptionEnabled = app.isEncryptionAvailable()

  const encryptionStatusString = hasUser
    ? STRING_E2E_ENABLED
    : hasPasscode
    ? STRING_LOCAL_ENC_ENABLED
    : STRING_ENC_NOT_ENABLED

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Encryption</Title>
        <Text>{encryptionStatusString}</Text>

        {isEncryptionEnabled && <EncryptionEnabled />}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Encryption)
