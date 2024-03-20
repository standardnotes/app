import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'

import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { useApplication } from '@/Components/ApplicationProvider'

type Props = {
  is2FAEnabled: boolean
}

const U2FDescription: FunctionComponent<Props> = ({ is2FAEnabled }) => {
  const application = useApplication()

  if (application.sessions.getUser() === undefined) {
    return <Text>Sign in or register for an account to configure hardware security keys.</Text>
  }

  return (
    <div>
      <Text>Authenticate with a hardware security key such as YubiKey.</Text>
      {!application.isFullU2FClient && (
        <Text className="italic">Please visit the web app in order to add a hardware security key.</Text>
      )}
      {!is2FAEnabled && (
        <Text className="italic">You must enable two-factor authentication before adding a hardware security key.</Text>
      )}
    </div>
  )
}

export default observer(U2FDescription)
