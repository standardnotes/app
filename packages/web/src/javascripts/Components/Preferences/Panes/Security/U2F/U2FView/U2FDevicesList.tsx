import { FunctionComponent, useCallback } from 'react'
import { observer } from 'mobx-react-lite'

import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'

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
    <div className="flex flex-row items-center">
      {devices.length > 0 && (
        <div className="flex flex-grow flex-col">
          <div>
            <Text>Devices:</Text>
          </div>
          {devices.map((device) => (
            <div key="device-{device.id}">
              <Text>{device.name}</Text>
              <Button
                key={device.id}
                primary={true}
                label="Delete"
                onClick={async () => handleDeleteButtonOnClick(device.id)}
              ></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default observer(U2FDevicesList)
