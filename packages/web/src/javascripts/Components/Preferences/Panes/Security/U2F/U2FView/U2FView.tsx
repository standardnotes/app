import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/Application'
import { UserProvider } from '@/Components/Preferences/Providers'

import U2FTitle from './U2FTitle'
import U2FDescription from './U2FDescription'
import Button from '@/Components/Button/Button'
import U2FAddDeviceView from '../U2FAddDeviceView'
import U2FDevicesList from './U2FDevicesList'
import ModalOverlay from '@/Components/Modal/ModalOverlay'

type Props = {
  application: WebApplication
  userProvider: UserProvider
}

const U2FView: FunctionComponent<Props> = ({ application, userProvider }) => {
  const [showDeviceAddingModal, setShowDeviceAddingModal] = useState(false)
  const [devices, setDevices] = useState<Array<{ id: string; name: string }>>([])
  const [error, setError] = useState('')

  const handleAddDeviceClick = useCallback(() => {
    setShowDeviceAddingModal(true)
  }, [])

  const loadAuthenticatorDevices = useCallback(async () => {
    const authenticatorListOrError = await application.listAuthenticators.execute()
    if (authenticatorListOrError.isFailed()) {
      setError(authenticatorListOrError.getError())

      return
    }

    setDevices(authenticatorListOrError.getValue())
  }, [setError, setDevices, application])

  useEffect(() => {
    loadAuthenticatorDevices().catch(console.error)
  }, [loadAuthenticatorDevices])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-col">
            <U2FTitle userProvider={userProvider} />
            <U2FDescription userProvider={userProvider} />
          </div>
        </PreferencesSegment>
        <PreferencesSegment classes="mt-2">
          {error && <div className="text-danger">{error}</div>}
          <U2FDevicesList
            application={application}
            devices={devices}
            onError={setError}
            onDeviceDeleted={loadAuthenticatorDevices}
          />
          <Button
            className="mt-1"
            disabled={!application.isFullU2FClient}
            label="Add Device"
            primary
            onClick={handleAddDeviceClick}
          />
        </PreferencesSegment>
      </PreferencesGroup>
      <ModalOverlay isOpen={showDeviceAddingModal}>
        <U2FAddDeviceView
          onDeviceAddingModalToggle={setShowDeviceAddingModal}
          onDeviceAdded={loadAuthenticatorDevices}
          userProvider={userProvider}
          addAuthenticator={application.addAuthenticator}
        />
      </ModalOverlay>
    </>
  )
}

export default observer(U2FView)
