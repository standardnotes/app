import { FunctionComponent, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { UseCaseInterface } from '@standardnotes/snjs'

import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import { UserProvider } from '@/Components/Preferences/Providers'

type Props = {
  userProvider: UserProvider
  addAuthenticator: UseCaseInterface<void>
  onDeviceAddingModalToggle: (show: boolean) => void
  onDeviceAdded: () => Promise<void>
}

const U2FAddDeviceView: FunctionComponent<Props> = ({
  userProvider,
  addAuthenticator,
  onDeviceAddingModalToggle,
  onDeviceAdded,
}) => {
  const [deviceName, setDeviceName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleDeviceNameChange = useCallback((deviceName: string) => {
    setDeviceName(deviceName)
  }, [])

  const handleAddDeviceClick = useCallback(async () => {
    if (!deviceName) {
      setErrorMessage('Device name is required')
      return
    }

    const user = userProvider.getUser()
    if (user === undefined) {
      setErrorMessage('User not found')
      return
    }

    const authenticatorAddedOrError = await addAuthenticator.execute({
      userUuid: user.uuid,
      authenticatorName: deviceName,
    })
    if (authenticatorAddedOrError.isFailed()) {
      setErrorMessage(authenticatorAddedOrError.getError())
      return
    }

    onDeviceAddingModalToggle(false)
    await onDeviceAdded()
  }, [deviceName, setErrorMessage, userProvider, addAuthenticator, onDeviceAddingModalToggle, onDeviceAdded])

  return (
    <ModalDialog>
      <ModalDialogLabel
        closeDialog={() => {
          onDeviceAddingModalToggle(false)
        }}
      >
        Add U2F Device
      </ModalDialogLabel>
      <ModalDialogDescription className="h-33 flex flex-col items-center gap-5 md:flex-row">
        <div className="w-25 h-25 flex items-center justify-center bg-info">...Some Cool Device Picture Here...</div>
        <div className="flex flex-grow flex-col gap-2">
          <DecoratedInput className={{ container: 'w-92 ml-4' }} value={deviceName} onChange={handleDeviceNameChange} />
        </div>
        {errorMessage && <div className="text-error">{errorMessage}</div>}
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button className="min-w-20" label="Add Device" onClick={handleAddDeviceClick} />
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(U2FAddDeviceView)
