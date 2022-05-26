import {
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
  STRING_E2E_ENABLED,
  STRING_ENC_NOT_ENABLED,
  STRING_LOCAL_ENC_ENABLED,
  STRING_NON_MATCHING_PASSCODES,
  StringUtils,
  Strings,
} from '@/Strings'
import { WebApplication } from '@/UIModels/Application'
import { preventRefreshing } from '@/Utils'
import { alertDialog } from '@/Services/AlertService'
import { ChangeEventHandler, FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { ApplicationEvent } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { AppState } from '@/UIModels/AppState'
import { PreferencesSegment, Title, Text, PreferencesGroup } from '@/Components/Preferences/PreferencesComponents'
import { Button } from '@/Components/Button/Button'

type Props = {
  application: WebApplication
  appState: AppState
}

export const PasscodeLock = observer(({ application, appState }: Props) => {
  const keyStorageInfo = StringUtils.keyStorageInfo(application)
  const passcodeAutoLockOptions = application.getAutolockService().getAutoLockIntervalOptions()

  const { setIsEncryptionEnabled, setIsBackupEncrypted, setEncryptionStatusString } = appState.accountMenu

  const passcodeInputRef = useRef<HTMLInputElement>(null)

  const [passcode, setPasscode] = useState<string | undefined>(undefined)
  const [passcodeConfirmation, setPasscodeConfirmation] = useState<string | undefined>(undefined)
  const [selectedAutoLockInterval, setSelectedAutoLockInterval] = useState<unknown>(null)
  const [isPasscodeFocused, setIsPasscodeFocused] = useState(false)
  const [showPasscodeForm, setShowPasscodeForm] = useState(false)
  const [canAddPasscode, setCanAddPasscode] = useState(!application.isEphemeralSession())
  const [hasPasscode, setHasPasscode] = useState(application.hasPasscode())

  const handleAddPassCode = () => {
    setShowPasscodeForm(true)
    setIsPasscodeFocused(true)
  }

  const changePasscodePressed = () => {
    handleAddPassCode()
  }

  const reloadAutoLockInterval = useCallback(async () => {
    const interval = await application.getAutolockService().getAutoLockInterval()
    setSelectedAutoLockInterval(interval)
  }, [application])

  const refreshEncryptionStatus = useCallback(() => {
    const hasUser = application.hasAccount()
    const hasPasscode = application.hasPasscode()

    setHasPasscode(hasPasscode)

    const encryptionEnabled = hasUser || hasPasscode

    const encryptionStatusString = hasUser
      ? STRING_E2E_ENABLED
      : hasPasscode
      ? STRING_LOCAL_ENC_ENABLED
      : STRING_ENC_NOT_ENABLED

    setEncryptionStatusString(encryptionStatusString)
    setIsEncryptionEnabled(encryptionEnabled)
    setIsBackupEncrypted(encryptionEnabled)
  }, [application, setEncryptionStatusString, setIsBackupEncrypted, setIsEncryptionEnabled])

  const selectAutoLockInterval = async (interval: number) => {
    if (!(await application.authorizeAutolockIntervalChange())) {
      return
    }
    await application.getAutolockService().setAutoLockInterval(interval)
    reloadAutoLockInterval().catch(console.error)
  }

  const removePasscodePressed = async () => {
    await preventRefreshing(STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL, async () => {
      if (await application.removePasscode()) {
        await application.getAutolockService().deleteAutolockPreference()
        await reloadAutoLockInterval()
        refreshEncryptionStatus()
      }
    })
  }

  const handlePasscodeChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target
    setPasscode(value)
  }

  const handleConfirmPasscodeChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target
    setPasscodeConfirmation(value)
  }

  const submitPasscodeForm = async (event: MouseEvent | FormEvent) => {
    event.preventDefault()

    if (!passcode || passcode.length === 0) {
      await alertDialog({
        text: Strings.enterPasscode,
      })
    }

    if (passcode !== passcodeConfirmation) {
      await alertDialog({
        text: STRING_NON_MATCHING_PASSCODES,
      })
      setIsPasscodeFocused(true)
      return
    }

    await preventRefreshing(STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE, async () => {
      const successful = application.hasPasscode()
        ? await application.changePasscode(passcode as string)
        : await application.addPasscode(passcode as string)

      if (!successful) {
        setIsPasscodeFocused(true)
      }
    })

    setPasscode(undefined)
    setPasscodeConfirmation(undefined)
    setShowPasscodeForm(false)

    refreshEncryptionStatus()
  }

  useEffect(() => {
    refreshEncryptionStatus()
  }, [refreshEncryptionStatus])

  // `reloadAutoLockInterval` gets interval asynchronously, therefore we call `useEffect` to set initial
  // value of `selectedAutoLockInterval`
  useEffect(() => {
    reloadAutoLockInterval().catch(console.error)
  }, [reloadAutoLockInterval])

  useEffect(() => {
    if (isPasscodeFocused) {
      passcodeInputRef.current?.focus()
      setIsPasscodeFocused(false)
    }
  }, [isPasscodeFocused])

  // Add the required event observers
  useEffect(() => {
    const removeKeyStatusChangedObserver = application.addEventObserver(async () => {
      setCanAddPasscode(!application.isEphemeralSession())
      setHasPasscode(application.hasPasscode())
      setShowPasscodeForm(false)
    }, ApplicationEvent.KeyStatusChanged)

    return () => {
      removeKeyStatusChangedObserver()
    }
  }, [application])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Passcode Lock</Title>

          {!hasPasscode && canAddPasscode && (
            <>
              <Text className="mb-3">Add a passcode to lock the application and encrypt on-device key storage.</Text>

              {keyStorageInfo && <Text className="mb-3">{keyStorageInfo}</Text>}

              {!showPasscodeForm && <Button label="Add passcode" onClick={handleAddPassCode} variant="primary" />}
            </>
          )}

          {!hasPasscode && !canAddPasscode && (
            <Text>
              Adding a passcode is not supported in temporary sessions. Please sign out, then sign back in with the
              "Stay signed in" option checked.
            </Text>
          )}

          {showPasscodeForm && (
            <form className="sk-panel-form" onSubmit={submitPasscodeForm}>
              <div className="sk-panel-row" />
              <input
                className="sk-input contrast"
                type="password"
                ref={passcodeInputRef}
                value={passcode}
                onChange={handlePasscodeChange}
                placeholder="Passcode"
              />
              <input
                className="sk-input contrast"
                type="password"
                value={passcodeConfirmation}
                onChange={handleConfirmPasscodeChange}
                placeholder="Confirm Passcode"
              />
              <div className="min-h-2" />
              <Button variant="primary" onClick={submitPasscodeForm} label="Set Passcode" className="mr-3" />
              <Button variant="normal" onClick={() => setShowPasscodeForm(false)} label="Cancel" />
            </form>
          )}

          {hasPasscode && !showPasscodeForm && (
            <>
              <Text>Passcode lock is enabled.</Text>
              <div className="flex flex-row mt-3">
                <Button variant="normal" label="Change Passcode" onClick={changePasscodePressed} className="mr-3" />
                <Button dangerStyle={true} label="Remove Passcode" onClick={removePasscodePressed} />
              </div>
            </>
          )}
        </PreferencesSegment>
      </PreferencesGroup>

      {hasPasscode && (
        <>
          <div className="min-h-3" />
          <PreferencesGroup>
            <PreferencesSegment>
              <Title>Autolock</Title>
              <Text className="mb-3">The autolock timer begins when the window or tab loses focus.</Text>
              <div className="flex flex-row items-center">
                {passcodeAutoLockOptions.map((option) => {
                  return (
                    <a
                      key={option.value}
                      className={`sk-a info mr-3 ${option.value === selectedAutoLockInterval ? 'boxed' : ''}`}
                      onClick={() => selectAutoLockInterval(option.value)}
                    >
                      {option.label}
                    </a>
                  )
                })}
              </div>
            </PreferencesSegment>
          </PreferencesGroup>
        </>
      )}
    </>
  )
})

PasscodeLock.displayName = 'PasscodeLock'
