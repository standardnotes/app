import { FunctionComponent, useCallback } from 'react'
import { observer } from 'mobx-react-lite'

import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'

type Props = {
  application: WebApplication
  devices: Array<{ id: string; name: string }>
  onDeviceDeleted: () => Promise<void>
  onError: (error: string) => void
}

const U2FDevicesList: FunctionComponent<Props> = ({ application, devices, onError, onDeviceDeleted }) => {
  const handleDeleteButtonOnClick = useCallback(
    async (authenticatorId: string) => {
      const deleteAuthenticatorOrError = await application.deleteAuthenticator.execute({
        authenticatorId,
      })

      if (deleteAuthenticatorOrError.isFailed()) {
        onError(deleteAuthenticatorOrError.getError())

        return
      }

      await onDeviceDeleted()
    },
    [application, onDeviceDeleted, onError],
  )

  return (
    <div>
      {devices.length > 0 && (
        <>
          <Subtitle>Devices</Subtitle>
          <div className="flex flex-grow flex-col divide-y divide-border">
            {devices.map((device) => (
              <div className="flex items-center py-2" key={`device-${device.id}`}>
                <Icon type="security" />
                <div className="ml-2 mr-auto text-sm">{device.name}</div>
                <Button
                  small
                  key={device.id}
                  label="Delete"
                  onClick={async () => handleDeleteButtonOnClick(device.id)}
                ></Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default observer(U2FDevicesList)
