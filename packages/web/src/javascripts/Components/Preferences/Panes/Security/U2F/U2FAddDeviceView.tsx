import { FunctionComponent, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { AddAuthenticator } from '@standardnotes/snjs'

import DecoratedInput from '@/Components/Input/DecoratedInput'
import Modal from '@/Components/Modal/Modal'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '@/Components/ApplicationProvider'

type Props = {
  addAuthenticator: AddAuthenticator
  onDeviceAddingModalToggle: (show: boolean) => void
  onDeviceAdded: () => Promise<void>
}

const U2FAddDeviceView: FunctionComponent<Props> = ({ addAuthenticator, onDeviceAddingModalToggle, onDeviceAdded }) => {
  const application = useApplication()

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

    const user = application.sessions.getUser()
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
  }, [deviceName, setErrorMessage, application, addAuthenticator, onDeviceAddingModalToggle, onDeviceAdded])

  const closeModal = () => {
    onDeviceAddingModalToggle(false)
  }

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return (
    <Modal
      title="Add Security Key"
      close={closeModal}
      actions={[
        {
          label: 'Cancel',
          type: 'cancel',
          onClick: closeModal,
          mobileSlot: 'left',
          hidden: !isMobileScreen,
        },
        {
          label: (
            <>
              Add <span className="hidden md:inline">Device</span>
            </>
          ),
          type: 'primary',
          onClick: handleAddDeviceClick,
          mobileSlot: 'right',
        },
      ]}
    >
      <div className="flex px-4 py-4">
        <div className="ml-4 flex flex-grow flex-col gap-1">
          <label htmlFor="u2f-device-name" className="mb-2 text-sm font-semibold">
            Device Name
          </label>
          <DecoratedInput
            autofocus
            id="u2f-device-name"
            className={{ container: 'w-92' }}
            value={deviceName}
            onChange={handleDeviceNameChange}
            onEnter={handleAddDeviceClick}
          />
          {errorMessage && <div className="mt-1.5 text-danger">{errorMessage}</div>}
        </div>
      </div>
    </Modal>
  )
}

export default observer(U2FAddDeviceView)
