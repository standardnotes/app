import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'

import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { useApplication } from '@/Components/ApplicationProvider'

const U2FTitle: FunctionComponent = () => {
  const application = useApplication()

  if (application.sessions.getUser() === undefined) {
    return <Title>Hardware security key authentication not available</Title>
  }

  return <Title>Hardware security key authentication</Title>
}

export default observer(U2FTitle)
