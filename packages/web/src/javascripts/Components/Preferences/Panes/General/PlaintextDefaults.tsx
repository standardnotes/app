import { WebApplication } from '@/Application/Application'
import Dropdown from '@/Components/Dropdown/Dropdown'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { EditorFontSize, PrefKey } from '@standardnotes/snjs'
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

  const [fontSize, setFontSize] = useState(() =>
    application.getPreference(PrefKey.EditorFontSize, PrefDefaults[PrefKey.EditorFontSize]),
  )

  const handleFontSizeChange = (value: string) => {
    setFontSize(value as EditorFontSize)
    void application.setPreference(PrefKey.EditorFontSize, value as EditorFontSize)
  }

  const fontSizeDropdownOptions = useMemo(
    () =>
      Object.values(EditorFontSize).map((fontSize) => ({
        label: fontSize,
        value: fontSize,
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
            <Subtitle>Font size</Subtitle>
            <Text>Sets the font size in plaintext notes</Text>
            <div className="mt-2">
              <Dropdown
                id="def-font-size"
                label="Select the font size for plaintext notes"
                items={fontSizeDropdownOptions}
                value={fontSize}
                onChange={handleFontSizeChange}
              />
            </div>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default PlaintextDefaults
