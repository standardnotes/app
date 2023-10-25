import { PrefKey, Platform } from '@standardnotes/snjs'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useState } from 'react'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import usePreference from '@/Hooks/usePreference'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

type Props = {
  application: WebApplication
}

export const AndroidConfirmBeforeExitKey = 'ConfirmBeforeExit'

const Defaults: FunctionComponent<Props> = ({ application }) => {
  const [androidConfirmBeforeExit, setAndroidConfirmBeforeExit] = useState(
    () => (application.getValue(AndroidConfirmBeforeExitKey) as boolean) ?? true,
  )

  const isMobile = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const spellcheck = usePreference(PrefKey.EditorSpellcheck)

  const addNoteToParentFolders = usePreference(PrefKey.NoteAddToParentFolders)

  const alwaysShowSuperToolbar = usePreference(PrefKey.AlwaysShowSuperToolbar)

  const toggleSpellcheck = () => {
    application.toggleGlobalSpellcheck().catch(console.error)
  }

  const toggleAndroidConfirmBeforeExit = () => {
    const newValue = !androidConfirmBeforeExit
    setAndroidConfirmBeforeExit(newValue)
    application.setValue(AndroidConfirmBeforeExitKey, newValue)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Defaults</Title>
        {application.platform === Platform.Android && (
          <>
            <div className="flex justify-between gap-2 md:items-center">
              <div className="flex flex-col">
                <Subtitle>Always ask before closing app (Android)</Subtitle>
                <Text>Whether a confirmation dialog should be shown before closing the app.</Text>
              </div>
              <Switch onChange={toggleAndroidConfirmBeforeExit} checked={androidConfirmBeforeExit} />
            </div>
            <HorizontalSeparator classes="my-4" />
          </>
        )}
        <div className="flex justify-between gap-2 md:items-center">
          <div className="flex flex-col">
            <Subtitle>Spellcheck</Subtitle>
            <Text>
              The default spellcheck value for new notes. Spellcheck can be configured per note from the note context
              menu. Spellcheck may degrade overall typing performance with long notes.
            </Text>
          </div>
          <Switch onChange={toggleSpellcheck} checked={spellcheck} />
        </div>
        <HorizontalSeparator classes="my-4" />
        <div className="flex justify-between gap-2 md:items-center">
          <div className="flex flex-col">
            <Subtitle>Add all parent tags when adding a nested tag to a note</Subtitle>
            <Text>When enabled, adding a nested tag to a note will automatically add all associated parent tags.</Text>
          </div>
          <Switch
            onChange={() => {
              application.setPreference(PrefKey.NoteAddToParentFolders, !addNoteToParentFolders).catch(console.error)
            }}
            checked={addNoteToParentFolders}
          />
        </div>
        <HorizontalSeparator classes="my-4" />
        {!isMobile && (
          <div className="flex justify-between gap-2 md:items-center">
            <div className="flex flex-col">
              <Subtitle>Use always-visible toolbar in Super notes</Subtitle>
              <Text>
                When enabled, the Super toolbar will always be shown at the top of the note. It can be temporarily
                toggled using Cmd/Ctrl+Shift+K. When disabled, the Super toolbar will only be shown as a floating
                toolbar when text is selected.
              </Text>
            </div>
            <Switch
              onChange={() => {
                application.setPreference(PrefKey.AlwaysShowSuperToolbar, !alwaysShowSuperToolbar).catch(console.error)
              }}
              checked={alwaysShowSuperToolbar}
            />
          </div>
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default Defaults
