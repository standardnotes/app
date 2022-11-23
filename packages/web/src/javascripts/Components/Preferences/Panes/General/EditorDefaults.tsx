import { WebApplication } from '@/Application/Application'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { EditorLineHeight, PrefKey } from '@standardnotes/snjs'
import { useMemo, useState } from 'react'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const EditorDefaults = ({ application }: Props) => {
  const [lineHeight, setLineHeight] = useState(() =>
    application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight]),
  )

  const handleLineHeightChange = (value: string) => {
    setLineHeight(value as EditorLineHeight)
    void application.setPreference(PrefKey.EditorLineHeight, value as EditorLineHeight)
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
        <Title>Editor Defaults</Title>
        <div>
          <div>
            <Subtitle>Line height</Subtitle>
            <Text>Sets the line height (leading) in plaintext & Super notes</Text>
            <div className="mt-2">
              <Dropdown
                id="def-line-height"
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

export default EditorDefaults
