import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import {
  FeatureIdentifier,
  PrefKey,
  ComponentArea,
  ComponentMutator,
  SNComponent,
  StorageValueModes,
  NewNoteTitleFormat,
} from '@standardnotes/snjs'
import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { FunctionComponent, useEffect, useMemo, useState } from 'react'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { PLAIN_EDITOR_NAME } from '@/Constants/Constants'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Button from '@/Components/Button/Button'
import CustomNoteTitleFormat from './Defaults/CustomNoteTitleFormat'
import { PrefDefaults } from '@/Constants/PrefDefaults'

type Props = {
  application: WebApplication
}

type EditorOption = DropdownItem & {
  value: FeatureIdentifier | 'plain-editor'
}

const makeEditorDefault = (application: WebApplication, component: SNComponent, currentDefault: SNComponent) => {
  if (currentDefault) {
    removeEditorDefault(application, currentDefault)
  }
  application.mutator
    .changeAndSaveItem(component, (m) => {
      const mutator = m as ComponentMutator
      mutator.defaultEditor = true
    })
    .catch(console.error)
}

const removeEditorDefault = (application: WebApplication, component: SNComponent) => {
  application.mutator
    .changeAndSaveItem(component, (m) => {
      const mutator = m as ComponentMutator
      mutator.defaultEditor = false
    })
    .catch(console.error)
}

const getDefaultEditor = (application: WebApplication) => {
  return application.componentManager.componentsForArea(ComponentArea.Editor).filter((e) => e.isDefaultEditor())[0]
}

const AlwaysOpenWebAppOnLaunchKey = 'AlwaysOpenWebAppOnLaunch'

const Defaults: FunctionComponent<Props> = ({ application }) => {
  const [editorItems, setEditorItems] = useState<DropdownItem[]>([])
  const [defaultEditorValue, setDefaultEditorValue] = useState(
    () => getDefaultEditor(application)?.package_info?.identifier || 'plain-editor',
  )

  const [spellcheck, setSpellcheck] = useState(() =>
    application.getPreference(PrefKey.EditorSpellcheck, PrefDefaults[PrefKey.EditorSpellcheck]),
  )

  const [newNoteTitleFormat, setNewNoteTitleFormat] = useState(() =>
    application.getPreference(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat]),
  )
  const handleNewNoteTitleFormatChange = (value: string) => {
    setNewNoteTitleFormat(value as NewNoteTitleFormat)
    application.setPreference(PrefKey.NewNoteTitleFormat, value as NewNoteTitleFormat)
  }

  const [addNoteToParentFolders, setAddNoteToParentFolders] = useState(() =>
    application.getPreference(PrefKey.NoteAddToParentFolders, PrefDefaults[PrefKey.NoteAddToParentFolders]),
  )

  const toggleSpellcheck = () => {
    setSpellcheck(!spellcheck)
    application.toggleGlobalSpellcheck().catch(console.error)
  }

  useEffect(() => {
    const editors = application.componentManager
      .componentsForArea(ComponentArea.Editor)
      .map((editor): EditorOption => {
        const identifier = editor.package_info.identifier
        const [iconType, tint] = application.iconsController.getIconAndTintForNoteType(editor.package_info.note_type)

        return {
          label: editor.displayName,
          value: identifier,
          ...(iconType ? { icon: iconType } : null),
          ...(tint ? { iconClassName: `text-accessory-tint-${tint}` } : null),
        }
      })
      .concat([
        {
          icon: 'plain-text',
          iconClassName: 'text-accessory-tint-1',
          label: PLAIN_EDITOR_NAME,
          value: 'plain-editor',
        },
      ])
      .sort((a, b) => {
        return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1
      })

    setEditorItems(editors)
  }, [application])

  const setDefaultEditor = (value: string) => {
    setDefaultEditorValue(value as FeatureIdentifier)
    const editors = application.componentManager.componentsForArea(ComponentArea.Editor)
    const currentDefault = getDefaultEditor(application)

    if (value !== 'plain-editor') {
      const editorComponent = editors.filter((e) => e.package_info.identifier === value)[0]
      makeEditorDefault(application, editorComponent, currentDefault)
    } else {
      removeEditorDefault(application, currentDefault)
    }
  }

  const switchToNativeView = async () => {
    application.setValue(AlwaysOpenWebAppOnLaunchKey, false, StorageValueModes.Nonwrapped)
    setTimeout(() => {
      application.deviceInterface.performSoftReset()
    }, 1000)
  }

  const noteTitleFormatOptions = useMemo(
    () => [
      {
        label: 'Current date and time',
        value: NewNoteTitleFormat.CurrentDateAndTime,
      },
      {
        label: 'Current note count',
        value: NewNoteTitleFormat.CurrentNoteCount,
      },
      {
        label: 'Custom format',
        value: NewNoteTitleFormat.CustomFormat,
      },
      {
        label: 'Empty',
        value: NewNoteTitleFormat.Empty,
      },
    ],
    [],
  )

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Defaults</Title>
        {application.isNativeMobileWeb() && (
          <>
            <div className="flex flex-col">
              <Subtitle>Switch to Classic Mobile Experience</Subtitle>
              <Text>
                This will close the app and switch back to the soon-to-be removed classic mobile experience. You can opt
                back in to new experience from the app settings.
              </Text>
              <Button className="mt-3 min-w-20" label="Switch" onClick={switchToNativeView} />
            </div>
            <HorizontalSeparator classes="my-4" />
          </>
        )}
        <div>
          <Subtitle>Default Note Type</Subtitle>
          <Text>New notes will be created using this type</Text>
          <div className="mt-2">
            <Dropdown
              id="def-editor-dropdown"
              label="Select the default note type"
              items={editorItems}
              value={defaultEditorValue}
              onChange={setDefaultEditor}
            />
          </div>
        </div>
        <HorizontalSeparator classes="my-4" />
        <div>
          <Subtitle>Default Note Title Format</Subtitle>
          <Text>New notes will be created with a title in this format</Text>
          <div className="mt-2">
            <Dropdown
              id="def-new-note-title-format"
              label="Select the default note type"
              items={noteTitleFormatOptions}
              value={newNoteTitleFormat}
              onChange={handleNewNoteTitleFormatChange}
            />
          </div>
        </div>
        {newNoteTitleFormat === NewNoteTitleFormat.CustomFormat && <CustomNoteTitleFormat application={application} />}
        <HorizontalSeparator classes="my-4" />
        <div className="flex items-center justify-between">
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
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Subtitle>Add all parent tags when adding a nested tag to a note</Subtitle>
            <Text>When enabled, adding a nested tag to a note will automatically add all associated parent tags.</Text>
          </div>
          <Switch
            onChange={() => {
              application.setPreference(PrefKey.NoteAddToParentFolders, !addNoteToParentFolders).catch(console.error)
              setAddNoteToParentFolders(!addNoteToParentFolders)
            }}
            checked={addNoteToParentFolders}
          />
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default Defaults
