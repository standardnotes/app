import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/WebApplication'
import { useEffect, useState } from 'react'
import { MobileDeviceInterface } from '@standardnotes/services'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import { isIOS } from '@standardnotes/ui-services'
import { c } from 'ttag'

type Props = {
  application: WebApplication
}

const MultitaskingPrivacy = ({ application }: Props) => {
  const [hasScreenshotPrivacy, setHasScreenshotPrivacy] = useState<boolean>(false)

  useEffect(() => {
    const hasScreenshotPrivacyEnabled = application.protections.getMobileScreenshotPrivacyEnabled()
    setHasScreenshotPrivacy(hasScreenshotPrivacyEnabled)
  }, [application])

  const onScreenshotPrivacyPress = async () => {
    const enable = !hasScreenshotPrivacy
    setHasScreenshotPrivacy(enable)

    application.protections.setMobileScreenshotPrivacyEnabled(enable)
    ;(application.device as MobileDeviceInterface).setAndroidScreenshotPrivacy(enable)
  }

  const screenshotPrivacyFeatureText = isIOS()
    ? c('B6.Preferences.Security.Title').t`Multitasking Privacy`
    : c('B6.Preferences.Security.Title').t`Multitasking/Screenshot Privacy`

  const screenshotPrivacyTitle = hasScreenshotPrivacy
    ? isIOS()
      ? c('B6.Preferences.Security.Action').t`Disable Multitasking Privacy`
      : c('B6.Preferences.Security.Action').t`Disable Multitasking/Screenshot Privacy`
    : isIOS()
    ? c('B6.Preferences.Security.Action').t`Enable Multitasking Privacy`
    : c('B6.Preferences.Security.Action').t`Enable Multitasking/Screenshot Privacy`

  return (
    <div>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{screenshotPrivacyFeatureText}</Title>
          <Button className={'mt-1'} label={screenshotPrivacyTitle} onClick={onScreenshotPrivacyPress} primary />
        </PreferencesSegment>
      </PreferencesGroup>
    </div>
  )
}

export default observer(MultitaskingPrivacy)
