import { WebApplication } from '@/Application/WebApplication'
import Dropdown from '@/Components/Dropdown/Dropdown'
import Icon from '@/Components/Icon/Icon'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { EditorFontSize, EditorLineHeight, EditorLineWidth, LocalPrefKey } from '@standardnotes/snjs'
import { useCallback, useMemo } from 'react'
import { SuperName, jtString } from '@standardnotes/features'
import { c } from 'ttag'
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

  const [monospaceFont, setMonospaceFont] = useLocalPreference(LocalPrefKey.EditorMonospaceEnabled)
  const toggleMonospaceFont = () => {
    setMonospaceFont(!monospaceFont)
  }

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
        <Title>{c('B6.Preferences.Appearance.Title').t`Editor`}</Title>
        <div className="mt-2">
          <div className="flex justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Subtitle>{c('B6.Preferences.Appearance.Subtitle').t`Monospace Font`}</Subtitle>
              <Text>
                {jtString(
                  c('B6.Preferences.Appearance.Info').jt`Toggles the font style in plaintext and ${SuperName} notes`,
                )}
              </Text>
            </div>
            <Switch onChange={toggleMonospaceFont} checked={monospaceFont} />
          </div>
          <HorizontalSeparator classes="my-4" />
          <div>
            <Subtitle>{c('B6.Preferences.Appearance.Subtitle').t`Font size`}</Subtitle>
            <Text>
              {jtString(
                c('B6.Preferences.Appearance.Action').jt`Sets the font size in plaintext and ${SuperName} notes`,
              )}
            </Text>
            <div className="mt-2">
              <Dropdown
                label={c('B6.Preferences.Appearance.Action').t`Select the font size for plaintext notes`}
                items={fontSizeDropdownOptions}
                value={fontSize}
                onChange={handleFontSizeChange}
              />
            </div>
          </div>
          <HorizontalSeparator classes="my-4" />
          <div>
            <Subtitle>{c('B6.Preferences.Appearance.Subtitle').t`Line height`}</Subtitle>
            <Text>
              {jtString(
                c('B6.Preferences.Appearance.Action')
                  .jt`Sets the line height (leading) in plaintext and ${SuperName} notes`,
              )}
            </Text>
            <div className="mt-2">
              <Dropdown
                label={c('B6.Preferences.Appearance.Action').t`Select the line height for plaintext notes`}
                items={lineHeightDropdownOptions}
                value={lineHeight}
                onChange={handleLineHeightChange}
              />
            </div>
          </div>
          <HorizontalSeparator classes="my-4" />
          <div>
            <Subtitle>{c('B6.Preferences.Appearance.Subtitle').t`Editor width`}</Subtitle>
            <Text>{c('B6.Preferences.Appearance.Action').t`Sets the max editor width for all notes`}</Text>
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
