import { MobileDevice } from '@Lib/Interface'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ApplicationContext } from '@Root/ApplicationContext'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { Option, SectionedOptionsTableCell } from '@Root/Components/SectionedOptionsTableCell'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { ModalStackNavigationProp } from '@Root/ModalStack'
import { SCREEN_INPUT_MODAL_PASSCODE, SCREEN_SETTINGS } from '@Root/Screens/screens'
import { MobileUnlockTiming, StorageEncryptionPolicy } from '@standardnotes/snjs'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Title } from './SecuritySection.styled'

type Props = {
  title: string
  hasPasscode: boolean
  encryptionAvailable: boolean
  updateProtectionsAvailable: (...args: unknown[]) => unknown
}

export const SecuritySection = (props: Props) => {
  const navigation = useNavigation<ModalStackNavigationProp<typeof SCREEN_SETTINGS>['navigation']>()
  // Context
  const application = useContext(ApplicationContext)

  // State
  const [encryptionPolicy, setEncryptionPolicy] = useState(() => application?.getStorageEncryptionPolicy())
  const [encryptionPolictChangeInProgress, setEncryptionPolictChangeInProgress] = useState(false)
  const [hasScreenshotPrivacy, setHasScreenshotPrivacy] = useState<boolean | undefined>(false)
  const [hasBiometrics, setHasBiometrics] = useState(false)
  const [supportsBiometrics, setSupportsBiometrics] = useState(false)
  const [biometricsTimingOptions, setBiometricsTimingOptions] = useState(() =>
    application!.getBiometricsTimingOptions(),
  )
  const [passcodeTimingOptions, setPasscodeTimingOptions] = useState(() => application!.getPasscodeTimingOptions())

  useEffect(() => {
    let mounted = true
    const getHasScreenshotPrivacy = async () => {
      const hasScreenshotPrivacyEnabled = application?.getMobileScreenshotPrivacyEnabled()
      if (mounted) {
        setHasScreenshotPrivacy(hasScreenshotPrivacyEnabled)
      }
    }
    void getHasScreenshotPrivacy()
    const getHasBiometrics = async () => {
      const appHasBiometrics = application!.hasBiometrics()
      if (mounted) {
        setHasBiometrics(appHasBiometrics)
      }
    }
    void getHasBiometrics()
    const hasBiometricsSupport = async () => {
      const hasBiometricsAvailable = await (
        application?.deviceInterface as MobileDevice
      ).getDeviceBiometricsAvailability()
      if (mounted) {
        setSupportsBiometrics(hasBiometricsAvailable)
      }
    }
    void hasBiometricsSupport()
    return () => {
      mounted = false
    }
  }, [application])

  useFocusEffect(
    useCallback(() => {
      if (props.hasPasscode) {
        setPasscodeTimingOptions(() => application!.getPasscodeTimingOptions())
      }
    }, [application, props.hasPasscode]),
  )

  const toggleEncryptionPolicy = async () => {
    if (!props.encryptionAvailable) {
      return
    }

    if (encryptionPolicy === StorageEncryptionPolicy.Default) {
      setEncryptionPolictChangeInProgress(true)
      setEncryptionPolicy(StorageEncryptionPolicy.Disabled)
      await application?.setStorageEncryptionPolicy(StorageEncryptionPolicy.Disabled)
      setEncryptionPolictChangeInProgress(false)
    } else if (encryptionPolicy === StorageEncryptionPolicy.Disabled) {
      setEncryptionPolictChangeInProgress(true)
      setEncryptionPolicy(StorageEncryptionPolicy.Default)
      await application?.setStorageEncryptionPolicy(StorageEncryptionPolicy.Default)
      setEncryptionPolictChangeInProgress(false)
    }
  }

  // State
  const storageEncryptionTitle = props.encryptionAvailable
    ? encryptionPolicy === StorageEncryptionPolicy.Default
      ? 'Disable Storage Encryption'
      : 'Enable Storage Encryption'
    : 'Storage Encryption'

  let storageSubText = "Encrypts your data before saving to your device's local storage."

  if (props.encryptionAvailable) {
    storageSubText +=
      encryptionPolicy === StorageEncryptionPolicy.Default
        ? ' Disable to improve app start-up speed.'
        : ' May decrease app start-up speed.'
  } else {
    storageSubText += ' Sign in, register, or add a local passcode to enable this option.'
  }

  if (encryptionPolictChangeInProgress) {
    storageSubText = 'Applying changes...'
  }

  const screenshotPrivacyFeatureText =
    Platform.OS === 'ios' ? 'Multitasking Privacy' : 'Multitasking/Screenshot Privacy'

  const screenshotPrivacyTitle = hasScreenshotPrivacy
    ? `Disable ${screenshotPrivacyFeatureText}`
    : `Enable ${screenshotPrivacyFeatureText}`

  const passcodeTitle = props.hasPasscode ? 'Disable Passcode Lock' : 'Enable Passcode Lock'

  const biometricTitle = hasBiometrics ? 'Disable Biometrics Lock' : 'Enable Biometrics Lock'

  const setBiometricsTiming = async (timing: MobileUnlockTiming) => {
    await application?.getAppState().setBiometricsTiming(timing)
    setBiometricsTimingOptions(() => application!.getBiometricsTimingOptions())
  }

  const setPasscodeTiming = async (timing: MobileUnlockTiming) => {
    await application?.getAppState().setPasscodeTiming(timing)
    setPasscodeTimingOptions(() => application!.getPasscodeTimingOptions())
  }

  const onScreenshotPrivacyPress = async () => {
    const enable = !hasScreenshotPrivacy
    setHasScreenshotPrivacy(enable)
    await application?.getAppState().setScreenshotPrivacyEnabled(enable)
  }

  const onPasscodePress = async () => {
    if (props.hasPasscode) {
      void disableAuthentication('passcode')
    } else {
      navigation.push(SCREEN_INPUT_MODAL_PASSCODE)
    }
  }

  const onBiometricsPress = async () => {
    if (hasBiometrics) {
      void disableAuthentication('biometrics')
    } else {
      setHasBiometrics(true)
      await application?.enableBiometrics()
      await setBiometricsTiming(MobileUnlockTiming.OnQuit)
      props.updateProtectionsAvailable()
    }
  }

  const disableBiometrics = useCallback(async () => {
    if (await application?.disableBiometrics()) {
      setHasBiometrics(false)
      props.updateProtectionsAvailable()
    }
  }, [application, props])

  const disablePasscode = useCallback(async () => {
    const hasAccount = Boolean(application?.hasAccount())
    let message
    if (hasAccount) {
      message =
        'Are you sure you want to disable your local passcode? This will not affect your encryption status, as your data is currently being encrypted through your sync account keys.'
    } else {
      message = 'Are you sure you want to disable your local passcode? This will disable encryption on your data.'
    }

    const confirmed = await application?.alertService?.confirm(
      message,
      'Disable Passcode',
      'Disable Passcode',
      undefined,
    )
    if (confirmed) {
      await application?.removePasscode()
    }
  }, [application])

  const disableAuthentication = useCallback(
    async (authenticationMethod: 'passcode' | 'biometrics') => {
      switch (authenticationMethod) {
        case 'biometrics': {
          void disableBiometrics()
          break
        }
        case 'passcode': {
          void disablePasscode()
          break
        }
      }
    },
    [disableBiometrics, disablePasscode],
  )

  return (
    <TableSection>
      <SectionHeader title={props.title} />

      <ButtonCell first leftAligned title={storageEncryptionTitle} onPress={toggleEncryptionPolicy}>
        <Title>{storageSubText}</Title>
      </ButtonCell>

      <ButtonCell leftAligned title={screenshotPrivacyTitle} onPress={onScreenshotPrivacyPress} />

      <ButtonCell leftAligned title={passcodeTitle} onPress={onPasscodePress} />

      <ButtonCell
        last={!hasBiometrics && !props.hasPasscode}
        disabled={!supportsBiometrics}
        leftAligned
        title={biometricTitle}
        onPress={onBiometricsPress}
      />

      {props.hasPasscode && (
        <SectionedOptionsTableCell
          leftAligned
          title={'Require Passcode'}
          options={passcodeTimingOptions}
          onPress={(option: Option) => setPasscodeTiming(option.key as MobileUnlockTiming)}
        />
      )}

      {hasBiometrics && (
        <SectionedOptionsTableCell
          leftAligned
          title={'Require Biometrics'}
          options={biometricsTimingOptions}
          onPress={(option: Option) => setBiometricsTiming(option.key as MobileUnlockTiming)}
        />
      )}
    </TableSection>
  )
}
