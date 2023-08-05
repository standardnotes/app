import {
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
  STRING_E2E_ENABLED,
  STRING_ENC_NOT_ENABLED,
  STRING_LOCAL_ENC_ENABLED,
  STRING_NON_MATCHING_PASSCODES,
  StringUtils,
  Strings,
} from '@/Constants/Strings'
import { WebApplication } from '@/Application/WebApplication'
import { preventRefreshing } from '@/Utils'
import { alertDialog } from '@standardnotes/ui-services'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { ApplicationEvent, MobileUnlockTiming } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import { classNames } from '@standardnotes/utils'

type Props = {
  application: WebApplication
}

const PasscodeLock = ({ application }: Props) => {
  const isNativeMobileWeb = application.isNativeMobileWeb()
  const keyStorageInfo = StringUtils.keyStorageInfo(application)

  const { setIsEncryptionEnabled, setIsBackupEncrypted, setEncryptionStatusString } = application.accountMenuController

  const passcodeInputRef = useRef<HTMLInputElement>(null)

  const [passcode, setPasscode] = useState<string>()
  const [passcodeConfirmation, setPasscodeConfirmation] = useState<string>()
  const [selectedAutoLockInterval, setSelectedAutoLockInterval] = useState<unknown>(null)
  const [isPasscodeFocused, setIsPasscodeFocused] = useState(false)
  const [showPasscodeForm, setShowPasscodeForm] = useState(false)
  const [canAddPasscode, setCanAddPasscode] = useState(!application.isEphemeralSession())
  const [hasPasscode, setHasPasscode] = useState(application.hasPasscode())

  const [mobilePasscodeTimingOptions, setMobilePasscodeTimingOptions] = useState(() =>
    application.protections.getMobilePasscodeTimingOptions(),
  )

  const handleAddPassCode = () => {
    setShowPasscodeForm(true)
    setIsPasscodeFocused(true)
  }

  const changePasscodePressed = () => {
    handleAddPassCode()
  }

  const reloadDesktopAutoLockInterval = useCallback(async () => {
    const interval = await application.autolockService?.getAutoLockInterval()
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

  const selectDesktopAutoLockInterval = async (interval: number) => {
    if (!(await application.authorizeAutolockIntervalChange())) {
      return
    }

    await application.autolockService?.setAutoLockInterval(interval)
    reloadDesktopAutoLockInterval().catch(console.error)
  }

  const setMobilePasscodeTiming = (timing: MobileUnlockTiming) => {
    application.protections.setMobilePasscodeTiming(timing)
    setMobilePasscodeTimingOptions(application.protections.getMobilePasscodeTimingOptions())
  }

  const removePasscodePressed = async () => {
    await preventRefreshing(STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL, async () => {
      if (await application.removePasscode()) {
        if (!isNativeMobileWeb) {
          await application.autolockService?.deleteAutolockPreference()
          await reloadDesktopAutoLockInterval()
        }
        refreshEncryptionStatus()
      }
    })
  }

  const handlePasscodeChange = (value: string) => {
    setPasscode(value)
  }

  const handleConfirmPasscodeChange = (value: string) => {
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

  useEffect(() => {
    if (!isNativeMobileWeb) {
      reloadDesktopAutoLockInterval().catch(console.error)
    }
  }, [reloadDesktopAutoLockInterval, isNativeMobileWeb])

  useEffect(() => {
    if (isPasscodeFocused) {
      passcodeInputRef.current?.focus()
      setIsPasscodeFocused(false)
    }
  }, [isPasscodeFocused])

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

  const cancelPasscodeForm = () => {
    setShowPasscodeForm(false)
    setPasscode(undefined)
    setPasscodeConfirmation(undefined)
  }

  const autolockService = application.autolockService

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Passcode lock</Title>

          {!hasPasscode && canAddPasscode && (
            <>
              <Text className="mb-3">Add a passcode to lock the application and encrypt on-device key storage.</Text>

              {keyStorageInfo && <Text className="mb-3">{keyStorageInfo}</Text>}

              {!showPasscodeForm && <Button label="Add passcode" onClick={handleAddPassCode} primary />}
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
              <DecoratedPasswordInput
                type="password"
                ref={passcodeInputRef}
                value={passcode ? passcode : ''}
                onChange={handlePasscodeChange}
                placeholder="Passcode"
              />
              <DecoratedPasswordInput
                className={{ container: 'mt-2' }}
                type="password"
                value={passcodeConfirmation ? passcodeConfirmation : ''}
                onChange={handleConfirmPasscodeChange}
                placeholder="Confirm Passcode"
              />
              <Button primary onClick={submitPasscodeForm} label="Set Passcode" className="mr-3 mt-3" />
              <Button onClick={cancelPasscodeForm} label="Cancel" />
            </form>
          )}

          {hasPasscode && !showPasscodeForm && (
            <>
              <Text>Passcode lock is enabled.</Text>
              <div className="mt-3 flex flex-row">
                <Button label="Change Passcode" onClick={changePasscodePressed} className="mr-3" />
                <Button colorStyle="danger" label="Remove Passcode" onClick={removePasscodePressed} />
              </div>
            </>
          )}
        </PreferencesSegment>
      </PreferencesGroup>

      {hasPasscode && autolockService && (
        <>
          <div className="min-h-3" />
          <PreferencesGroup>
            <PreferencesSegment>
              <Title>Autolock</Title>
              <Text className="mb-3">The autolock timer begins when the window or tab loses focus.</Text>
              <div className="flex flex-row items-center">
                {autolockService.getAutoLockIntervalOptions().map((option) => {
                  return (
                    <a
                      key={option.value}
                      className={classNames(
                        'mr-3 cursor-pointer rounded',
                        option.value === selectedAutoLockInterval
                          ? 'bg-info px-1.5 py-0.5 text-info-contrast'
                          : 'text-info',
                      )}
                      onClick={() => selectDesktopAutoLockInterval(option.value)}
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

      {hasPasscode && isNativeMobileWeb && (
        <>
          <div className="min-h-3" />
          <PreferencesGroup>
            <PreferencesSegment>
              <Title>Passcode Autolock</Title>
              <div className="flex flex-row items-center">
                <div className="mt-2 flex flex-row items-center">
                  <div className={'mr-3'}>Require Passcode</div>
                  {mobilePasscodeTimingOptions.map((option) => {
                    return (
                      <a
                        key={option.key}
                        className={classNames(
                          'mr-3 cursor-pointer rounded px-1.5 py-0.5',
                          option.selected ? 'bg-info text-info-contrast' : 'text-info',
                        )}
                        onClick={() => {
                          void setMobilePasscodeTiming(option.key as MobileUnlockTiming)
                        }}
                      >
                        {option.title}
                      </a>
                    )
                  })}
                </div>
              </div>
            </PreferencesSegment>
          </PreferencesGroup>
        </>
      )}
    </>
  )
}

export default observer(PasscodeLock)
