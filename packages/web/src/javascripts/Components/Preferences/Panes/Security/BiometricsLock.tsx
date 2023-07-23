import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import { WebApplication } from '@/Application/WebApplication'
import { MobileDeviceInterface } from '@standardnotes/services'
import { MobileUnlockTiming } from '@standardnotes/snjs'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import Button from '@/Components/Button/Button'
import { classNames } from '@standardnotes/utils'

type Props = {
  application: WebApplication
}

const BiometricsLock = ({ application }: Props) => {
  const [hasBiometrics, setHasBiometrics] = useState(false)
  const [supportsBiometrics, setSupportsBiometrics] = useState(false)
  const [biometricsTimingOptions, setBiometricsTimingOptions] = useState(() =>
    application.protections.getMobileBiometricsTimingOptions(),
  )

  useEffect(() => {
    const appHasBiometrics = application.protections.hasBiometricsEnabled()
    setHasBiometrics(appHasBiometrics)

    const hasBiometricsSupport = async () => {
      const hasBiometricsAvailable = await (
        application.device as MobileDeviceInterface
      ).getDeviceBiometricsAvailability?.()
      setSupportsBiometrics(hasBiometricsAvailable)
    }
    void hasBiometricsSupport()
  }, [application])

  const setBiometricsTimingValue = async (timing: MobileUnlockTiming) => {
    application.protections.setMobileBiometricsTiming(timing)
    setBiometricsTimingOptions(() => application.protections.getMobileBiometricsTimingOptions())
  }

  const disableBiometrics = useCallback(async () => {
    if (await application.protections.disableBiometrics()) {
      setHasBiometrics(false)
    }
  }, [application])

  const onBiometricsPress = async () => {
    if (hasBiometrics) {
      await disableBiometrics()
    } else {
      setHasBiometrics(true)
      application.protections.enableBiometrics()
      await setBiometricsTimingValue(MobileUnlockTiming.OnQuit)
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
                    className={classNames(
                      'mr-3 cursor-pointer rounded px-1.5 py-0.5',
                      option.selected ? 'bg-info text-info-contrast' : 'text-info',
                    )}
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
