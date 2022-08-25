// TODO: reached here - try not to include logic that will go to other file (such as Passcode protection related)

import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import { WebApplication } from '@/Application/Application'
import { ApplicationEvent, MobileDeviceInterface } from '@standardnotes/services'
import { MobileUnlockTiming } from '@standardnotes/snjs'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'

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
      alert(
        'hasBiometricsAvailable (2) ' +
          (application.deviceInterface as MobileDeviceInterface).getDeviceBiometricsAvailability,
      )
      // alert('hasBiometricsAvailable ' + hasBiometricsAvailable)
      setSupportsBiometrics(hasBiometricsAvailable)
      // }
    }
    void getHasBiometrics()
    void hasBiometricsSupport()
  }, [application])

  const setBiometricsTiming = async (timing: MobileUnlockTiming) => {
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
      await setBiometricsTiming(MobileUnlockTiming.OnQuit)
      updateProtectionsAvailable()
    }
  }

  const biometricTitle = hasBiometrics ? 'Disable Biometrics Lock' : 'Enable Biometrics Lock'

  // return <div>{/*<div className={!supportsBiometrics && ''}>asdf</div>*/}</div>
  // TODO: find better class name for `SOME-DISABLED-CLASS`
  return (
    <div>
      <div className={supportsBiometrics ? 'SOME-DISABLED-CLASS' : ''} onClick={onBiometricsPress}>
        {biometricTitle}
      </div>

      {hasBiometrics && (
        <>
          {/*<SectionedOptionsTableCell
            leftAligned
            title={'Require Biometrics'}
            options={biometricsTimingOptions}
            onPress={(option: Option) => setBiometricsTiming(option.key as UnlockTiming)}
          />*/}
          <PreferencesGroup>
            <PreferencesSegment>
              <Title>Require Biometrics</Title>
              {/*<Text className="mb-3">The autolock timer begins when the window or tab loses focus.</Text>*/}
              <div className="flex flex-row items-center">
                {biometricsTimingOptions.map((option) => {
                  return (
                    <a
                      key={option.key}
                      /*className={`mr-3 cursor-pointer rounded text-info ${
                        option.value === selectedAutoLockInterval ? 'bg-info px-1.5 py-0.5 text-info-contrast' : ''
                      }`}*/
                      className={'mr-3 cursor-pointer rounded text-info'}
                      // onClick={(option: Option) => setBiometricsTiming(option.key as MobileUnlockTiming)}

                      // onClick={() => setBiometricsTiming(option.key as MobileUnlockTiming)}
                      onClick={() => {
                        alert('setting option to ' + option.key)
                        void setBiometricsTiming(option.key as MobileUnlockTiming)
                      }}
                    >
                      {option.title}
                    </a>
                  )
                })}
              </div>
            </PreferencesSegment>
          </PreferencesGroup>
        </>
      )}
    </div>
  )
}

export default observer(BiometricsLock)
