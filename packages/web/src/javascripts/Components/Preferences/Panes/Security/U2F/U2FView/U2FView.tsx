import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'

import U2FTitle from './U2FTitle'
import U2FDescription from './U2FDescription'
import Button from '@/Components/Button/Button'
import U2FAddDeviceView from '../U2FAddDeviceView'
import U2FDevicesList from './U2FDevicesList'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import RecoveryCodeBanner from '@/Components/RecoveryCodeBanner/RecoveryCodeBanner'

type Props = {
  application: WebApplication
  is2FAEnabled: boolean
  loadAuthenticatorsCallback: (devices: Array<{ id: string; name: string }>) => void
}

const U2FView: FunctionComponent<Props> = ({ application, is2FAEnabled, loadAuthenticatorsCallback }) => {
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

    const authenticatorList = authenticatorListOrError.getValue()
    setDevices(authenticatorList)
    loadAuthenticatorsCallback(authenticatorList)
  }, [setError, setDevices, application, loadAuthenticatorsCallback])

  useEffect(() => {
    loadAuthenticatorDevices().catch(console.error)
  }, [loadAuthenticatorDevices])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <div className="flex flex-col">
            <U2FTitle />
            <U2FDescription is2FAEnabled={is2FAEnabled} />
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
            disabled={!application.isFullU2FClient || !is2FAEnabled}
            label="Add Device"
            primary
            onClick={handleAddDeviceClick}
          />
        </PreferencesSegment>
        {devices.length > 0 && (
          <PreferencesSegment>
            <div className="mt-3">
              <RecoveryCodeBanner application={application} />
            </div>
          </PreferencesSegment>
        )}
      </PreferencesGroup>
      <ModalOverlay isOpen={showDeviceAddingModal} close={() => setShowDeviceAddingModal(false)}>
        <U2FAddDeviceView
          onDeviceAddingModalToggle={setShowDeviceAddingModal}
          onDeviceAdded={loadAuthenticatorDevices}
          addAuthenticator={application.addAuthenticator}
        />
      </ModalOverlay>
    </>
  )
}

export default observer(U2FView)
