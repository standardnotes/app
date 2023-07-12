import Switch from '@/Components/Switch/Switch'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { PrefKey, PrefDefaults } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const Tools: FunctionComponent<Props> = ({ application }: Props) => {
  const [updateSavingIndicator, setUpdateSavingIndicator] = useState(() =>
    application.getPreference(PrefKey.UpdateSavingStatusIndicator, PrefDefaults[PrefKey.UpdateSavingStatusIndicator]),
  )

  const toggleSavingIndicatorUpdates = () => {
    setUpdateSavingIndicator(!updateSavingIndicator)
    application.setPreference(PrefKey.UpdateSavingStatusIndicator, !updateSavingIndicator).catch(console.error)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Tools</Title>
        <div>
          <div className="flex justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Subtitle>Show note saving status while editing</Subtitle>
              <Text>
                Control whether the animated saving status is shown while editing. Error statuses are always shown
                regardless of preference.
              </Text>
            </div>
            <Switch onChange={toggleSavingIndicatorUpdates} checked={updateSavingIndicator} />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Tools)
