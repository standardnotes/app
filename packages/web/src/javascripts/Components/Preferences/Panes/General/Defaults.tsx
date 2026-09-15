import { PrefKey, Platform, PrefValue } from '@standardnotes/snjs'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useMemo, useState } from 'react'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import usePreference from '@/Hooks/usePreference'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { SuperName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

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
  const defaultSuperImageAlignment = usePreference(PrefKey.SuperNoteImageAlignment)
  const imageAlignmentOptions = useMemo(
    (): DropdownItem[] => [
      {
        icon: 'format-align-left',
        label: c('B6.Preferences.General.Label').t`Left align`,
        value: 'left',
      },
      {
        icon: 'format-align-center',
        label: c('B6.Preferences.General.Label').t`Center align`,
        value: 'center',
      },
      {
        icon: 'format-align-right',
        label: c('B6.Preferences.General.Label').t`Right align`,
        value: 'right',
      },
    ],
    [],
  )

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
        <Title>{c('B6.Preferences.General.Title').t`Defaults`}</Title>
        {application.platform === Platform.Android && (
          <>
            <div className="flex justify-between gap-2 md:items-center">
              <div className="flex flex-col">
                <Subtitle>{c('B6.Preferences.General.Subtitle').t`Always ask before closing app (Android)`}</Subtitle>
                <Text>{c('B6.Preferences.General.Info')
                  .t`Whether a confirmation dialog should be shown before closing the app.`}</Text>
              </div>
              <Switch onChange={toggleAndroidConfirmBeforeExit} checked={androidConfirmBeforeExit} />
            </div>
            <HorizontalSeparator classes="my-4" />
          </>
        )}
        <div className="flex justify-between gap-2 md:items-center">
          <div className="flex flex-col">
            <Subtitle>{c('B6.Preferences.General.Subtitle').t`Spellcheck`}</Subtitle>
            <Text>
              {c('B6.Preferences.General.Info')
                .t`The default spellcheck value for new notes. Spellcheck can be configured per note from the note context menu. Spellcheck may degrade overall typing performance with long notes.`}
            </Text>
          </div>
          <Switch onChange={toggleSpellcheck} checked={spellcheck} />
        </div>
        <HorizontalSeparator classes="my-4" />
        <div className="flex justify-between gap-2 md:items-center">
          <div className="flex flex-col">
            <Subtitle>{c('B6.Preferences.General.Subtitle')
              .t`Add all parent tags when adding a nested tag to a note`}</Subtitle>
            <Text>
              {c('B6.Preferences.General.Info')
                .t`When enabled, adding a nested tag to a note will automatically add all associated parent tags.`}
            </Text>
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
          <>
            <div className="flex justify-between gap-2 md:items-center">
              <div className="flex flex-col">
                <Subtitle>
                  {jtString(c('B6.Preferences.General.Subtitle').jt`Use always-visible toolbar in ${SuperName} notes`)}
                </Subtitle>
                <Text>
                  {jtString(
                    c('B6.Preferences.General.Info')
                      .jt`When enabled, the ${SuperName} toolbar will always be shown at the top of the note. It can be temporarily toggled using Cmd/Ctrl+Shift+K. When disabled, the ${SuperName} toolbar will only be shown as a floating toolbar when text is selected.`,
                  )}
                </Text>
              </div>
              <Switch
                onChange={() => {
                  application
                    .setPreference(PrefKey.AlwaysShowSuperToolbar, !alwaysShowSuperToolbar)
                    .catch(console.error)
                }}
                checked={alwaysShowSuperToolbar}
              />
            </div>
            <HorizontalSeparator classes="my-4" />
          </>
        )}
        <div>
          <Subtitle>
            {jtString(c('B6.Preferences.General.Subtitle').jt`Default image alignment in ${SuperName} notes`)}
          </Subtitle>
          <div className="mt-2">
            <Dropdown
              label={jtString(c('B6.Preferences.General.Info').jt`Default image alignment in ${SuperName} notes`)}
              items={imageAlignmentOptions}
              value={defaultSuperImageAlignment}
              onChange={(alignment) => {
                application
                  .setPreference(
                    PrefKey.SuperNoteImageAlignment,
                    alignment as PrefValue[PrefKey.SuperNoteImageAlignment],
                  )
                  .catch(console.error)
              }}
            />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default Defaults
