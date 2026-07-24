import { WebApplication } from '@/Application/WebApplication'
import Dropdown from '@/Components/Dropdown/Dropdown'
import Icon from '@/Components/Icon/Icon'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { EditorFontSize, EditorLineHeight, EditorLineWidth, LocalPrefKey, EditorFontFamily } from '@standardnotes/snjs'
import { useCallback, useMemo } from 'react'
import { Subtitle, Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { CHANGE_EDITOR_WIDTH_COMMAND } from '@standardnotes/ui-services'
import { useLocalPreference } from '../../../../Hooks/usePreference'

type Props = {
  application: WebApplication
}

const EditorDefaults = ({ application }: Props) => {
  const [lineHeight, setLineHeight] = useLocalPreference(LocalPrefKey.EditorLineHeight)

  const handleLineHeightChange = (value: string) => {
    setLineHeight(value as EditorLineHeight)
  }

  const lineHeightDropdownOptions = useMemo(
    () =>
      Object.values(EditorLineHeight).map((lineHeight) => ({
        label: lineHeight,
        value: lineHeight,
      })),
    [],
  )

  const [fontFamily, setFontFamily] = useLocalPreference(LocalPrefKey.EditorFontFamily)
  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value as EditorFontFamily)
  }

  const fontFamilyDropdownOptions = useMemo(
    () => [
      { label: 'Sans-serif (System default)', value: EditorFontFamily.SansSerif },
      { label: 'Monospace (System default)', value: EditorFontFamily.Monospace },
      { label: 'Serif (Georgia)', value: EditorFontFamily.Serif },
      { label: 'Lora (Serif)', value: EditorFontFamily.Lora },
      { label: 'Merriweather (Serif)', value: EditorFontFamily.Merriweather },
      { label: 'Open Sans (Modern sans-serif)', value: EditorFontFamily.OpenSans },
      { label: 'Roboto Mono (Modern monospace)', value: EditorFontFamily.RobotoMono },
      { label: 'Dyslexic-friendly (Comic Neue)', value: EditorFontFamily.Dyslexic },
      { label: 'Quicksand (Rounded sans-serif)', value: EditorFontFamily.Quicksand },
      { label: 'Comic Sans', value: EditorFontFamily.ComicSans },
    ],
    [],
  )

  const [fontSize, setFontSize] = useLocalPreference(LocalPrefKey.EditorFontSize)
  const handleFontSizeChange = (value: string) => {
    setFontSize(value as EditorFontSize)
  }

  const fontSizeDropdownOptions = useMemo(
    () =>
      Object.values(EditorFontSize).map((fontSize) => ({
        label: fontSize,
        value: fontSize,
      })),
    [],
  )

  const [editorWidth] = useLocalPreference(LocalPrefKey.EditorLineWidth)

  const toggleEditorWidthModal = useCallback(() => {
    application.keyboardService.triggerCommand(CHANGE_EDITOR_WIDTH_COMMAND, true)
  }, [application.keyboardService])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Editor</Title>
        <div className="mt-2">
          <div>
            <Subtitle>Font family</Subtitle>
            <Text>Sets the font family in plaintext and Super notes</Text>
            <div className="mt-2">
              <Dropdown
                label="Select the font family for notes"
                items={fontFamilyDropdownOptions}
                value={fontFamily}
                onChange={handleFontFamilyChange}
              />
            </div>
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
                className="flex w-full min-w-55 items-center justify-between rounded border border-border bg-default px-3.5 py-1.5 text-left text-base text-foreground md:w-fit lg:text-sm"
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
