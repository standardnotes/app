import { Pill, Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Button from '@/Components/Button/Button'
import Switch from '@/Components/Switch/Switch'
import { usePremiumModal } from '@/Hooks/usePremiumModal'

type Props = {
  application: WebApplication
}

const Timelapse: FunctionComponent<Props> = ({ application }: Props) => {
  const timelapseEnabled = application.timelapseService.isEnabled
  const premiumModal = usePremiumModal()

  const enable = useCallback(() => {
    if (!application.featuresController.entitledToFiles) {
      premiumModal.activate('Moments')
      return
    }
    void application.timelapseService.enableTimelapse()
  }, [application, premiumModal])

  const disable = useCallback(() => {
    void application.timelapseService.disableTimelapse()
  }, [application])

  const toggle = useCallback(() => {
    if (timelapseEnabled) {
      disable()
    } else {
      enable()
    }
  }, [timelapseEnabled, enable, disable])

  const takePhoto = useCallback(() => {
    if (!application.featuresController.entitledToFiles) {
      premiumModal.activate('Moments')
      return
    }

    void application.timelapseService.takePhoto()
  }, [application, premiumModal])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <Title>Moments 📸</Title>
            <Pill style={'warning'}>Labs</Pill>
            <Pill style={'info'}>Professional Plan</Pill>
          </div>
          <Switch onChange={toggle} checked={timelapseEnabled} />
        </div>

        <Subtitle>Capture photos of yourself at regular intervals</Subtitle>

        <div className="flex items-center justify-between">
          <div className="flex flex-col"></div>
          <PreferencesSegment>
            <Text>
              Capture your face every day of your life, right in Standard Notes. Moments takes a candid photo of you
              throughout the day using your webcam. Photos are end-to-end encrypted and uploaded to your private
              account.
            </Text>

            <Text className="mt-3">
              Why? Many of us spend a good part of the day working on a computer, whether it's coding, writing, or just
              browsing the web. Moments is a fun way to capture your life and look back on it.
            </Text>

            <Text className="mt-3">
              Moments currently takes a photo on app startup and every half hour. This will be customizable in the
              future.
            </Text>
            <div className="mt-5 flex flex-row flex-wrap gap-3">
              <Button colorStyle="info" onClick={takePhoto}>
                Capture Present Moment
              </Button>
            </div>
          </PreferencesSegment>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Timelapse)
