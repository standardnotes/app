// TODO: reached here - try not to include logic that will go to other file (such as Passcode protection related)

import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import { WebApplication } from '@/Application/Application'
import { ApplicationEvent, MobileDeviceInterface } from '@standardnotes/services'
import { MobileUnlockTiming } from '@standardnotes/snjs'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import Button from '@/Components/Button/Button'

type Props = {
  application: WebApplication
}

const BiometricsLock = ({ application }: Props) => {
  const [hasBiometrics, setHasBiometrics] = useState(false)
  const [supportsBiometrics, setSupportsBiometrics] = useState(false)
  const [biometricsTimingOptions, setBiometricsTimingOptions] = useState(() =>
    // TODO: remove all initial unserscores from "useState" variables and make sure no unused variables are there
    // const [_biometricsTimingOptions, setBiometricsTimingOptions] = useState(() =>
    application.getBiometricsTimingOptions(),
  )
  // const [protectionsAvailable, setProtectionsAvailable] = useState(application.hasProtectionSources())
  const [_protectionsAvailable, setProtectionsAvailable] = useState(application.hasProtectionSources())

  useEffect(() => {
    // TODO: (GENERAL NOTE) This effect will run only on this page, but this logic seems needs to run on top-level since it's more general.
    //  Look at the source where this logic is copied from, so it would become more clear.

    const removeOnAppStartObserver = application.addEventObserver(async () => {
      // TODO: trying to implement "await this.loadUnlockTiming()" call from 'mobile/ApplicationState.ts' - doesn't recognize 'loadMobileUnlockTiming'
      alert('loading mobile unlock timing')
      await application.loadMobileUnlockTiming()
    }, ApplicationEvent.Started)

    return () => {
      removeOnAppStartObserver()
    }
  }, [application])

  useEffect(() => {
    const getHasBiometrics = async () => {
      const appHasBiometrics = await application.hasBiometrics()
      console.log('appHasBiometrics ', appHasBiometrics)
      // if (mounted) {
      setHasBiometrics(appHasBiometrics)
      // }
    }

    const hasBiometricsSupport = async () => {
      const hasBiometricsAvailable = await (application.deviceInterface as MobileDeviceInterface)
        // ).getDeviceBiometricsAvailability()
        .getDeviceBiometricsAvailability?.()
      // if (mounted) {
      setSupportsBiometrics(hasBiometricsAvailable)
      // }
    }
    void getHasBiometrics()
    void hasBiometricsSupport()
  }, [application])

  const setBiometricsTimingValue = async (timing: MobileUnlockTiming) => {
    await application.setBiometricsTiming(timing)
    setBiometricsTimingOptions(() => application.getBiometricsTimingOptions())
  }

  const updateProtectionsAvailable = useCallback(() => {
    setProtectionsAvailable(application.hasProtectionSources())
  }, [application])

  const disableBiometrics = useCallback(async () => {
    if (await application.disableBiometrics()) {
      setHasBiometrics(false)
      updateProtectionsAvailable()
    }
  }, [application, updateProtectionsAvailable])

  const disablePasscode = useCallback(async () => {
    const hasAccount = Boolean(application.hasAccount())
    let message
    if (hasAccount) {
      message =
        'Are you sure you want to disable your local passcode? This will not affect your encryption status, as your data is currently being encrypted through your sync account keys.'
    } else {
      message = 'Are you sure you want to disable your local passcode? This will disable encryption on your data.'
    }

    const confirmed = await application.alertService?.confirm(
      message,
      'Disable Passcode',
      'Disable Passcode',
      undefined,
    )
    if (confirmed) {
      await application.removePasscode()
    }
  }, [application])

  const disableAuthentication = useCallback(
    async (authenticationMethod: 'passcode' | 'biometrics') => {
      switch (authenticationMethod) {
        case 'biometrics': {
          // void disableBiometrics()
          await disableBiometrics()
          break
        }
        case 'passcode': {
          // void disablePasscode()
          await disablePasscode()
          break
        }
      }
    },
    [disableBiometrics, disablePasscode],
  )

  const onBiometricsPress = async () => {
    console.log('`onBiometricsPress`: hasBiometrics is ', hasBiometrics)
    if (hasBiometrics) {
      // void disableAuthentication('biometrics')
      await disableAuthentication('biometrics')
    } else {
      setHasBiometrics(true)
      await application.enableBiometrics()
      await setBiometricsTimingValue(MobileUnlockTiming.OnQuit)
      updateProtectionsAvailable()
    }
  }

  const biometricTitle = hasBiometrics ? 'Disable Biometrics Lock' : 'Enable Biometrics Lock'

  if (!supportsBiometrics) {
    return null
  }

  return (
    <div>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Biometrics Lock</Title>
          <Button className={'mt-1'} label={biometricTitle} onClick={onBiometricsPress} primary />
          {hasBiometrics && (
            <div className="mt-2 flex flex-row items-center">
              <div className={'mr-3'}>Require Biometrics</div>
              {biometricsTimingOptions.map((option) => {
                return (
                  <a
                    key={option.key}
                    className={'mr-3 cursor-pointer rounded text-info'}
                    onClick={() => {
                      void setBiometricsTimingValue(option.key as MobileUnlockTiming)
                    }}
                  >
                    {option.title}
                  </a>
                )
              })}
            </div>
          )}
        </PreferencesSegment>
      </PreferencesGroup>
    </div>
  )
}

export default observer(BiometricsLock)
