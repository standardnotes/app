import { WebApplication } from '@/Application/WebApplication'
import Dropdown from '@/Components/Dropdown/Dropdown'
import Icon from '@/Components/Icon/Icon'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { ApplicationEvent, EditorFontSize, EditorLineHeight, EditorLineWidth, PrefKey } from '@standardnotes/snjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { CHANGE_EDITOR_WIDTH_COMMAND } from '@standardnotes/ui-services'

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

  const [editorWidth, setEditorWidth] = useState(() =>
    application.getPreference(PrefKey.EditorLineWidth, PrefDefaults[PrefKey.EditorLineWidth]),
  )

  const toggleEditorWidthModal = useCallback(() => {
    application.keyboardService.triggerCommand(CHANGE_EDITOR_WIDTH_COMMAND, true)
  }, [application.keyboardService])

  useEffect(() => {
    return application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      setEditorWidth(application.getPreference(PrefKey.EditorLineWidth, PrefDefaults[PrefKey.EditorLineWidth]))
    })
  }, [application])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Editor appearance</Title>
        <div className="mt-2">
          <div className="flex justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Subtitle>Monospace Font</Subtitle>
              <Text>Toggles the font style in plaintext and Super notes</Text>
            </div>
            <Switch onChange={toggleMonospaceFont} checked={monospaceFont} />
          </div>
          <HorizontalSeparator classes="my-4" />
          <div>
            <Subtitle>Font size</Subtitle>
            <Text>Sets the font size in plaintext and Super notes</Text>
            <div className="mt-2">
              <Dropdown
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
            <Text>Sets the line height (leading) in plaintext and Super notes</Text>
            <div className="mt-2">
              <Dropdown
                label="Select the line height for plaintext notes"
                items={lineHeightDropdownOptions}
                value={lineHeight}
                onChange={handleLineHeightChange}
              />
            </div>
          </div>
          <HorizontalSeparator classes="my-4" />
          <div>
            <Subtitle>Editor width</Subtitle>
            <Text>Sets the max editor width for all notes</Text>
            <div className="mt-2">
              <button
                className="flex w-full min-w-55 items-center justify-between rounded border border-border bg-default py-1.5 px-3.5 text-left text-base text-foreground md:w-fit lg:text-sm"
                onClick={toggleEditorWidthModal}
              >
                {editorWidth === EditorLineWidth.FullWidth ? 'Full width' : editorWidth}
                <Icon type="chevron-down" size="normal" />
              </button>
            </div>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default EditorDefaults
