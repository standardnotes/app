import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'

import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { UserProvider } from '@/Components/Preferences/Providers'
import { useApplication } from '@/Components/ApplicationProvider'

type Props = {
  userProvider: UserProvider
}

const U2FDescription: FunctionComponent<Props> = ({ userProvider }) => {
  const application = useApplication()

  if (userProvider.getUser() === undefined) {
    return <Text>Sign in or register for an account to configure hardware security keys.</Text>
  }

  return (
    <div>
      <Text>Authenticate with a hardware security key such as YubiKey.</Text>
      {!application.isFullU2FClient && (
        <Text className="italic">Please visit the web app in order to add a hardware security key.</Text>
      )}
    </div>
  )
}

export default observer(U2FDescription)
