import { Pill, Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
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
  const momentsEnabled = application.momentsService.isEnabled
  const premiumModal = usePremiumModal()

  const defaultTagId = usePreference(PrefKey.MomentsDefaultTagUuid)
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
    void application.momentsService.enableMoments()
  }, [application, premiumModal])

  const disable = useCallback(() => {
    void application.momentsService.disableMoments()
  }, [application])

  const toggle = useCallback(() => {
    if (momentsEnabled) {
      disable()
    } else {
      enable()
    }
  }, [momentsEnabled, enable, disable])

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
            <Pill style={'success'}>Labs</Pill>
            <Pill style={'info'}>Professional</Pill>
          </div>
          <Switch onChange={toggle} checked={momentsEnabled} />
        </div>

        <Subtitle>Your personal photo journal</Subtitle>

        {momentsEnabled && (
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
              contentTypes={[ContentType.TYPES.Tag]}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col"></div>
          <PreferencesSegment>
            <Text>
              Moments lets you capture photos of yourself throughout the day, creating a visual record of your life, one
              photo at a time. Using your webcam or mobile selfie-cam, Moments takes a photo of you every half hour. All
              photos are end-to-end encrypted and stored in your files. Enable Moments on a per-device basis to get
              started.
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
