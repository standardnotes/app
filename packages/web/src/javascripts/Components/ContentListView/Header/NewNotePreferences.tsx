import {
  ComponentArea,
  ComponentMutator,
  FeatureIdentifier,
  NewNoteTitleFormat,
  PrefKey,
  SNComponent,
  TagPreferences,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplication } from '@/Application/Application'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'
import { PreferenceMode } from './PreferenceMode'
import dayjs from 'dayjs'
import { getDropdownItemsForAllEditors, PlainEditorType } from '@/Utils/DropdownItemsForEditors'

const PrefChangeDebounceTimeInMs = 25

const HelpPageUrl = 'https://day.js.org/docs/en/display/format#list-of-all-available-formats'

const NoteTitleFormatOptions = [
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
]

type Props = {
  application: WebApplication
  selectedTag: AnyTag
  mode: PreferenceMode
  changePreferencesCallback: (properties: Partial<TagPreferences>) => Promise<void>
  disabled?: boolean
}

const NewNotePreferences: FunctionComponent<Props> = ({
  application,
  selectedTag,
  mode,
  changePreferencesCallback,
  disabled,
}: Props) => {
  const [editorItems, setEditorItems] = useState<DropdownItem[]>([])
  const [defaultEditorIdentifier, setDefaultEditorIdentifier] = useState<string>(PlainEditorType)
  const [newNoteTitleFormat, setNewNoteTitleFormat] = useState<NewNoteTitleFormat>(
    NewNoteTitleFormat.CurrentDateAndTime,
  )
  const [customNoteTitleFormat, setCustomNoteTitleFormat] = useState('')

  const getGlobalEditorDefault = useCallback((): SNComponent | undefined => {
    return application.componentManager.componentsForArea(ComponentArea.Editor).filter((e) => e.isDefaultEditor())[0]
  }, [application])

  const reloadPreferences = useCallback(() => {
    if (mode === 'tag' && selectedTag.preferences?.editorIdentifier) {
      setDefaultEditorIdentifier(selectedTag.preferences?.editorIdentifier)
    } else {
      const globalDefault = getGlobalEditorDefault()
      setDefaultEditorIdentifier(globalDefault?.identifier || PlainEditorType)
    }

    if (mode === 'tag' && selectedTag.preferences?.newNoteTitleFormat) {
      setNewNoteTitleFormat(selectedTag.preferences?.newNoteTitleFormat)
    } else {
      setNewNoteTitleFormat(
        application.getPreference(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat]),
      )
    }
  }, [mode, selectedTag, application, getGlobalEditorDefault, setDefaultEditorIdentifier, setNewNoteTitleFormat])

  useEffect(() => {
    if (mode === 'tag' && selectedTag.preferences?.customNoteTitleFormat) {
      setCustomNoteTitleFormat(selectedTag.preferences?.customNoteTitleFormat)
    } else {
      setCustomNoteTitleFormat(
        application.getPreference(PrefKey.CustomNoteTitleFormat, PrefDefaults[PrefKey.CustomNoteTitleFormat]),
      )
    }
  }, [application, mode, selectedTag])

  useEffect(() => {
    void reloadPreferences()
  }, [reloadPreferences])

  const setNewNoteTitleFormatChange = (value: string) => {
    setNewNoteTitleFormat(value as NewNoteTitleFormat)
    if (mode === 'global') {
      application.setPreference(PrefKey.NewNoteTitleFormat, value as NewNoteTitleFormat)
    } else {
      void changePreferencesCallback({ newNoteTitleFormat: value as NewNoteTitleFormat })
    }
  }

  const removeEditorGlobalDefault = (application: WebApplication, component: SNComponent) => {
    application.mutator
      .changeAndSaveItem(component, (m) => {
        const mutator = m as ComponentMutator
        mutator.defaultEditor = false
      })
      .catch(console.error)
  }

  const makeEditorGlobalDefault = (
    application: WebApplication,
    component: SNComponent,
    currentDefault?: SNComponent,
  ) => {
    if (currentDefault) {
      removeEditorGlobalDefault(application, currentDefault)
    }
    application.mutator
      .changeAndSaveItem(component, (m) => {
        const mutator = m as ComponentMutator
        mutator.defaultEditor = true
      })
      .catch(console.error)
  }

  useEffect(() => {
    setEditorItems(getDropdownItemsForAllEditors(application))
  }, [application])

  const setDefaultEditor = (value: string) => {
    setDefaultEditorIdentifier(value as FeatureIdentifier)

    if (mode === 'global') {
      const editors = application.componentManager.componentsForArea(ComponentArea.Editor)
      const currentDefault = getGlobalEditorDefault()

      if (value !== PlainEditorType) {
        const editorComponent = editors.filter((e) => e.package_info.identifier === value)[0]
        makeEditorGlobalDefault(application, editorComponent, currentDefault)
      } else if (currentDefault) {
        removeEditorGlobalDefault(application, currentDefault)
      }
    } else {
      void changePreferencesCallback({ editorIdentifier: value })
    }
  }

  const debounceTimeoutRef = useRef<number>()

  const handleCustomFormatInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const newFormat = event.currentTarget.value
    setCustomNoteTitleFormat(newFormat)

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = window.setTimeout(async () => {
      if (mode === 'tag') {
        void changePreferencesCallback({ customNoteTitleFormat: newFormat })
      } else {
        application.setPreference(PrefKey.CustomNoteTitleFormat, newFormat)
      }
    }, PrefChangeDebounceTimeInMs)
  }

  return (
    <div className="my-1 px-3 pb-2 pt-1">
      <div className="text-base font-semibold uppercase text-text lg:text-xs">New Note Defaults</div>
      <div>
        <div className="mt-3 text-mobile-menu-item md:text-menu-item">Note Type</div>
        <div className="mt-2">
          <Dropdown
            portal={false}
            disabled={disabled}
            fullWidth={true}
            id="def-editor-dropdown"
            label="Select the default note type"
            items={editorItems}
            value={defaultEditorIdentifier}
            onChange={setDefaultEditor}
          />
        </div>
      </div>
      <div>
        <div className="mt-3 text-mobile-menu-item md:text-menu-item">Title Format</div>
        <div className="mt-2">
          <Dropdown
            portal={false}
            disabled={disabled}
            fullWidth={true}
            id="def-new-note-title-format"
            label="Select the default note type"
            items={NoteTitleFormatOptions}
            value={newNoteTitleFormat}
            onChange={setNewNoteTitleFormatChange}
          />
        </div>
      </div>
      {newNoteTitleFormat === NewNoteTitleFormat.CustomFormat && (
        <div className="mt-2">
          <div className="mt-2">
            <input
              disabled={disabled}
              className="w-full min-w-55 rounded border border-solid border-passive-3 bg-default px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-info"
              placeholder="e.g. YYYY-MM-DD"
              value={customNoteTitleFormat}
              onChange={handleCustomFormatInputChange}
              spellCheck={false}
            />
          </div>
          <div className="mt-3 text-neutral">
            <span className="font-bold">Preview: </span>
            <em>{dayjs().format(customNoteTitleFormat)}</em>
          </div>
          <div className="mt-2 text-neutral">
            <a
              className="underline"
              href={HelpPageUrl}
              rel="noreferrer"
              target="_blank"
              onClick={(event) => {
                if (application.isNativeMobileWeb()) {
                  event.preventDefault()
                  application.mobileDevice().openUrl(HelpPageUrl)
                }
              }}
            >
              Options
            </a>
            . Use <code>[]</code> to escape formatting.
          </div>
        </div>
      )}
    </div>
  )
}

export default observer(NewNotePreferences)
