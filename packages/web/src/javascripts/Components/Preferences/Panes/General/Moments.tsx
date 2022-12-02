import { Pill, Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Button from '@/Components/Button/Button'
import Switch from '@/Components/Switch/Switch'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import ItemSelectionDropdown from '@/Components/ItemSelectionDropdown/ItemSelectionDropdown'
import { ContentType, DecryptedItem, PrefKey, SNTag } from '@standardnotes/snjs'
import usePreference from '@/Hooks/usePreference'
import LinkedItemBubble from '@/Components/LinkedItems/LinkedItemBubble'
import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'

type Props = {
  application: WebApplication
}

const Moments: FunctionComponent<Props> = ({ application }: Props) => {
  const timelapseEnabled = application.momentsService.isEnabled
  const premiumModal = usePremiumModal()

  const defaultTagId = usePreference<string>(PrefKey.MomentsDefaultTagUuid)
  const [defaultTag, setDefaultTag] = useState<SNTag | undefined>()

  useEffect(() => {
    if (!defaultTagId) {
      setDefaultTag(undefined)
      return
    }

    const tag = application.items.findItem(defaultTagId) as SNTag | undefined
    setDefaultTag(tag)
  }, [defaultTagId, application])

  const enable = useCallback(() => {
    if (!application.featuresController.entitledToFiles) {
      premiumModal.activate('Moments')
      return
    }
    void application.momentsService.enableTimelapse()
  }, [application, premiumModal])

  const disable = useCallback(() => {
    void application.momentsService.disableTimelapse()
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

    void application.momentsService.takePhoto()
  }, [application, premiumModal])

  const selectTag = useCallback(
    (tag: DecryptedItem) => {
      void application.setPreference(PrefKey.MomentsDefaultTagUuid, tag.uuid)
    },
    [application],
  )

  const unselectTag = useCallback(async () => {
    void application.setPreference(PrefKey.MomentsDefaultTagUuid, undefined)
  }, [application])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <Title>Moments</Title>
            <Pill style={'warning'}>Labs</Pill>
            <Pill style={'info'}>Professional Plan</Pill>
          </div>
          <Switch onChange={toggle} checked={timelapseEnabled} />
        </div>

        <Subtitle>Capture photos of yourself at regular intervals</Subtitle>

        {timelapseEnabled && (
          <div className="mb-2 flex items-center">
            {defaultTag && (
              <div>
                <LinkedItemBubble
                  className="m-1 mr-2"
                  link={createLinkFromItem(defaultTag, 'linked')}
                  unlinkItem={unselectTag}
                  isBidirectional={false}
                  inlineFlex={true}
                />
              </div>
            )}
            <ItemSelectionDropdown
              onSelection={selectTag}
              placeholder="Select tag to save Moments to..."
              contentTypes={[ContentType.Tag]}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col"></div>
          <PreferencesSegment>
            <Text>
              Capture a portrait of yourself every day of your life, right in Standard Notes. Moments takes a candid
              photo of you throughout the day using your webcam. Photos are end-to-end encrypted and uploaded to your
              private account.
            </Text>

            <Text className="mt-3">
              Why? Many of us spend a good part of the day working on a computer, whether it's coding, writing, or just
              browsing the web. Moments is a fun way to capture your life.
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

export default observer(Moments)
