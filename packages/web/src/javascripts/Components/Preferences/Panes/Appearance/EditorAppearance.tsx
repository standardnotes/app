import { WebApplication } from '@/Application/Application'
import Dropdown from '@/Components/Dropdown/Dropdown'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { EditorFontSize, EditorLineHeight, PrefKey } from '@standardnotes/snjs'
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

  const [marginResizers, setMarginResizers] = useState(() =>
    application.getPreference(PrefKey.EditorResizersEnabled, PrefDefaults[PrefKey.EditorResizersEnabled]),
  )

  const toggleMarginResizers = () => {
    setMarginResizers(!marginResizers)
    application.setPreference(PrefKey.EditorResizersEnabled, !marginResizers).catch(console.error)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Editor Appearance</Title>
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Subtitle>Margin Resizers</Subtitle>
              <Text>Allows left and right editor margins to be resized.</Text>
            </div>
            <Switch onChange={toggleMarginResizers} checked={marginResizers} />
          </div>
          <HorizontalSeparator classes="my-4" />
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
          <HorizontalSeparator classes="my-4" />
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
