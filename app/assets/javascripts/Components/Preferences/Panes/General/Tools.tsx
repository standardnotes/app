import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/UIModels/Application'
import { PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const Tools: FunctionComponent<Props> = ({ application }: Props) => {
  const [monospaceFont, setMonospaceFont] = useState(() =>
    application.getPreference(PrefKey.EditorMonospaceEnabled, true),
  )
  const [marginResizers, setMarginResizers] = useState(() =>
    application.getPreference(PrefKey.EditorResizersEnabled, true),
  )

  const toggleMonospaceFont = () => {
    setMonospaceFont(!monospaceFont)
    application.setPreference(PrefKey.EditorMonospaceEnabled, !monospaceFont).catch(console.error)
  }

  const toggleMarginResizers = () => {
    setMarginResizers(!marginResizers)
    application.setPreference(PrefKey.EditorResizersEnabled, !marginResizers).catch(console.error)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Tools</Title>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Subtitle>Monospace Font</Subtitle>
              <Text>Toggles the font style in the Plain Text editor.</Text>
            </div>
            <Switch onChange={toggleMonospaceFont} checked={monospaceFont} />
          </div>
          <HorizontalSeparator classes="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Subtitle>Margin Resizers</Subtitle>
              <Text>Allows left and right editor margins to be resized.</Text>
            </div>
            <Switch onChange={toggleMarginResizers} checked={marginResizers} />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Tools)
