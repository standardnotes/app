import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import Dropdown from '@/Components/Dropdown/Dropdown'
import Icon from '@/Components/Icon/Icon'
import { SuperEditorMetadata } from '@/Constants/Constants'
import { getIconAndTintForNoteType } from '@/Utils/Items/Icons/getIconAndTintForNoteType'
import {
  ApplicationEvent,
  EditorFeatureDescription,
  EditorIdentifier,
  FeatureIdentifier,
  NoteType,
  PrefKey,
  PrefValue,
} from '@standardnotes/snjs'
import { useEffect, useMemo, useState } from 'react'
import { Subtitle, Title } from '../PreferencesComponents/Content'
import PreferencesGroup from '../PreferencesComponents/PreferencesGroup'
import PreferencesPane from '../PreferencesComponents/PreferencesPane'
import PreferencesSegment from '../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const ImportExport = ({ application }: Props) => {
  const [exportTypePrefs, setExportTypePrefs] = useState<PrefValue[PrefKey.NoteExportTypes]>(
    () => application.getPreference(PrefKey.NoteExportTypes) || {},
  )
  useEffect(() => {
    return application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      setExportTypePrefs(application.getPreference(PrefKey.NoteExportTypes) as PrefValue[PrefKey.NoteExportTypes])
    })
  }, [application])

  const editors: {
    name: string
    identifier: EditorIdentifier
    noteType: NoteType
    default: EditorFeatureDescription['file_type']
  }[] = [
    {
      name: 'Plain Text',
      identifier: FeatureIdentifier.PlainEditor,
      noteType: NoteType.Plain,
      default: 'txt' as EditorFeatureDescription['file_type'],
    },
    {
      name: SuperEditorMetadata.name,
      identifier: FeatureIdentifier.SuperEditor,
      noteType: NoteType.Super,
      default: 'json' as EditorFeatureDescription['file_type'],
    },
  ].concat(
    application.items
      .getDisplayableComponents()
      .filter((component) => component.isEditor())
      .map((component) => ({
        name: component.name,
        identifier: component.identifier,
        noteType: component.noteType,
        default: component.package_info.file_type || 'txt',
      })),
  )

  const DropdownItems = useMemo(() => {
    return [
      {
        label: 'Plain Text',
        value: 'txt',
      },
      {
        label: 'Markdown',
        value: 'md',
      },
      {
        label: 'HTML',
        value: 'html',
      },
      {
        label: 'JSON',
        value: 'json',
      },
    ]
  }, [])

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Export Defaults</Title>
          <Subtitle>
            Default file type when exporting a note{' '}
            <span className="text-passive-0">
              (Note: Only Super notes will be converted to the select format, other note types will only be saved with
              the file type for the selected format)
            </span>
          </Subtitle>
          <div className="mt-2 flex select-none flex-col gap-2">
            {editors.map((editor) => {
              const [iconName, iconTint] = getIconAndTintForNoteType(editor.noteType)

              return (
                <div className="flex items-center gap-4 overflow-hidden" key={editor.identifier}>
                  <Icon type={iconName} className={`flex-shrink-0 text-accessory-tint-${iconTint}`} size="large" />
                  <div className="mr-auto overflow-hidden text-ellipsis whitespace-nowrap text-base lg:text-sm">
                    {editor.name}
                  </div>
                  <Dropdown
                    classNameOverride={{
                      button: '!min-w-[20ch] !max-w-[20ch]',
                    }}
                    portal={false}
                    id={`${editor.identifier}-export-type`}
                    label={`Export file type for ${editor.name}`}
                    items={DropdownItems}
                    value={exportTypePrefs[editor.identifier] || editor.default}
                    onChange={(value) => {
                      void application.setPreference(
                        PrefKey.NoteExportTypes,
                        Object.assign({}, exportTypePrefs, {
                          [editor.identifier]: value,
                        }),
                      )
                    }}
                  />
                </div>
              )
            })}
          </div>
          <Button
            className="mt-3"
            onClick={() => {
              void application.setPreference(PrefKey.NoteExportTypes, {})
            }}
          >
            Reset
          </Button>
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default ImportExport
