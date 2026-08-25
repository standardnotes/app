import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { AddAuthenticator } from '@standardnotes/snjs'

import DecoratedInput from '@/Components/Input/DecoratedInput'
import Modal from '@/Components/Modal/Modal'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '@/Components/ApplicationProvider'
import { c } from 'ttag'

type Props = {
  addAuthenticator: AddAuthenticator
  onDeviceAddingModalToggle: (show: boolean) => void
  onDeviceAdded: () => Promise<void>
}

const U2FAddDeviceView: FunctionComponent<Props> = ({ addAuthenticator, onDeviceAddingModalToggle, onDeviceAdded }) => {
  const application = useApplication()

  const [deviceName, setDeviceName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [registrationOptions, setRegistrationOptions] = useState<Record<string, unknown> | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  useEffect(() => {
    let isActive = true

    void application.fetchAuthenticatorRegistrationOptions().then((options) => {
      if (!isActive) {
        return
      }
      setRegistrationOptions(options)
      setIsLoadingOptions(false)
      if (options === null) {
        setErrorMessage(c('B6.Preferences.Security.Error').t`Could not prepare security key registration`)
      }
    })

    return () => {
      isActive = false
    }
  }, [application])

  const handleDeviceNameChange = useCallback((deviceName: string) => {
    setDeviceName(deviceName)
  }, [])

  const handleAddDeviceClick = useCallback(async () => {
    if (!deviceName) {
      setErrorMessage(c('B6.Preferences.Security.Error').t`Device name is required`)
      return
    }

    if (!registrationOptions) {
      setErrorMessage(c('B6.Preferences.Security.Error').t`Could not prepare security key registration`)
      return
    }

    const user = application.sessions.getUser()
    if (user === undefined) {
      setErrorMessage(c('B6.Preferences.Security.Error').t`User not found`)
      return
    }

    const authenticatorAddedOrError = await addAuthenticator.execute({
      userUuid: user.uuid,
      authenticatorName: deviceName,
      registrationOptions,
    })
    if (authenticatorAddedOrError.isFailed()) {
      setErrorMessage(authenticatorAddedOrError.getError())
      return
    }

    onDeviceAddingModalToggle(false)
    await onDeviceAdded()
  }, [
    deviceName,
    registrationOptions,
    setErrorMessage,
    application,
    addAuthenticator,
    onDeviceAddingModalToggle,
    onDeviceAdded,
  ])

  const closeModal = () => {
    onDeviceAddingModalToggle(false)
  }

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  return (
    <Modal
      title={c('B6.Preferences.Security.Title').t`Add Security Key`}
      close={closeModal}
      actions={[
        {
          label: c('B6.Preferences.Security.Action').t`Cancel`,
          type: 'cancel',
          onClick: closeModal,
          mobileSlot: 'left',
          hidden: !isMobileScreen,
        },
        {
          label: (
            <>
              {c('B6.Preferences.Security.Action').t`Add`}{' '}
              <span className="hidden md:inline">{c('B6.Preferences.Security.Label').t`Device`}</span>
            </>
          ),
          type: 'primary',
          onClick: handleAddDeviceClick,
          mobileSlot: 'right',
          disabled: isLoadingOptions || registrationOptions === null,
        },
      ]}
    >
      <div className="flex px-4 py-4">
        <div className="ml-4 flex flex-grow flex-col gap-1">
          <label htmlFor="u2f-device-name" className="mb-2 text-sm font-semibold">
            {c('B6.Preferences.Security.Label').t`Device Name`}
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
