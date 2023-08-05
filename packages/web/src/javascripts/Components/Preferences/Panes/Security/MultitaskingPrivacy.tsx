import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/WebApplication'
import { useEffect, useState } from 'react'
import { MobileDeviceInterface } from '@standardnotes/services'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import { isIOS } from '@standardnotes/ui-services'

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

  const screenshotPrivacyFeatureText = isIOS() ? 'Multitasking Privacy' : 'Multitasking/Screenshot Privacy'
  const screenshotPrivacyTitle = hasScreenshotPrivacy
    ? `Disable ${screenshotPrivacyFeatureText}`
    : `Enable ${screenshotPrivacyFeatureText}`

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
