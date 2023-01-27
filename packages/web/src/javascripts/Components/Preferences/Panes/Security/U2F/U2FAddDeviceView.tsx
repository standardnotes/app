import { FunctionComponent, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { UseCaseInterface } from '@standardnotes/snjs'

import DecoratedInput from '@/Components/Input/DecoratedInput'
import { UserProvider } from '@/Components/Preferences/Providers'
import Modal from '@/Components/Modal/Modal'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

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

  const closeModal = () => {
    onDeviceAddingModalToggle(false)
  }

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return (
    <Modal
      title="Add U2F Device"
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
      <div className="w-25 h-25 flex items-center justify-center bg-info">...Some Cool Device Picture Here...</div>
      <div className="flex flex-grow flex-col gap-2">
        <DecoratedInput className={{ container: 'w-92 ml-4' }} value={deviceName} onChange={handleDeviceNameChange} />
      </div>
      {errorMessage && <div className="text-error">{errorMessage}</div>}
    </Modal>
  )
}

export default observer(U2FAddDeviceView)
