import { WebApplication } from '@/Application/Application'
import Dropdown from '@/Components/Dropdown/Dropdown'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { EditorLineHeight, PrefKey } from '@standardnotes/snjs'
import { useMemo, useState } from 'react'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const PlaintextDefaults = ({ application }: Props) => {
  const [monospaceFont, setMonospaceFont] = useState(() =>
    application.getPreference(PrefKey.EditorMonospaceEnabled, PrefDefaults[PrefKey.EditorMonospaceEnabled]),
  )

  const toggleMonospaceFont = () => {
    setMonospaceFont(!monospaceFont)
    application.setPreference(PrefKey.EditorMonospaceEnabled, !monospaceFont).catch(console.error)
  }

  const [lineHeight, setLineHeight] = useState(() =>
    application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight]),
  )

  const handleLineHeightChange = (value: string) => {
    setLineHeight(value as EditorLineHeight)
    application.setPreference(PrefKey.EditorLineHeight, value as EditorLineHeight)
  }

  const lineHeightDropdownOptions = useMemo(
    () =>
      Object.values(EditorLineHeight).map((lineHeight) => ({
        label: lineHeight,
        value: lineHeight,
      })),
    [],
  )

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Plaintext Note Defaults</Title>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Subtitle>Monospace Font</Subtitle>
              <Text>Toggles the font style in plaintext notes</Text>
            </div>
            <Switch onChange={toggleMonospaceFont} checked={monospaceFont} />
          </div>
          <HorizontalSeparator classes="my-4" />
          <div>
            <Subtitle>Line height</Subtitle>
            <Text>Sets the line height (leading) in plaintext notes</Text>
            <div className="mt-2">
              <Dropdown
                id="def-new-note-title-format"
                label="Select the line height for plaintext notes"
                items={lineHeightDropdownOptions}
                value={lineHeight}
                onChange={handleLineHeightChange}
              />
            </div>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default PlaintextDefaults
