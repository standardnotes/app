import { FeatureIdentifier, NewNoteTitleFormat, PrefKey, EditorIdentifier, TagPreferences } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplication } from '@/Application/Application'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'
import { PreferenceMode } from './PreferenceMode'
import dayjs from 'dayjs'
import { EditorOption, getDropdownItemsForAllEditors } from '@/Utils/DropdownItemsForEditors'
import { classNames } from '@standardnotes/utils'
import { NoteTitleFormatOptions } from './NoteTitleFormatOptions'

const PrefChangeDebounceTimeInMs = 25

const HelpPageUrl = 'https://day.js.org/docs/en/display/format#list-of-all-available-formats'

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
  const [defaultEditorIdentifier, setDefaultEditorIdentifier] = useState<EditorIdentifier>(
    FeatureIdentifier.PlainEditor,
  )
  const [newNoteTitleFormat, setNewNoteTitleFormat] = useState<NewNoteTitleFormat>(
    NewNoteTitleFormat.CurrentDateAndTime,
  )
  const [customNoteTitleFormat, setCustomNoteTitleFormat] = useState('')

  const getGlobalEditorDefaultIdentifier = useCallback((): string => {
    return application.geDefaultEditorIdentifier()
  }, [application])

  const reloadPreferences = useCallback(() => {
    if (mode === 'tag' && selectedTag.preferences?.editorIdentifier) {
      setDefaultEditorIdentifier(selectedTag.preferences?.editorIdentifier)
    } else {
      const globalDefault = getGlobalEditorDefaultIdentifier()
      setDefaultEditorIdentifier(globalDefault)
    }

    if (mode === 'tag' && selectedTag.preferences?.newNoteTitleFormat) {
      setNewNoteTitleFormat(selectedTag.preferences?.newNoteTitleFormat)
    } else {
      setNewNoteTitleFormat(
        application.getPreference(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat]),
      )
    }
  }, [
    mode,
    selectedTag,
    application,
    getGlobalEditorDefaultIdentifier,
    setDefaultEditorIdentifier,
    setNewNoteTitleFormat,
  ])

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
      void application.setPreference(PrefKey.NewNoteTitleFormat, value as NewNoteTitleFormat)
    } else {
      void changePreferencesCallback({ newNoteTitleFormat: value as NewNoteTitleFormat })
    }
  }

  useEffect(() => {
    setEditorItems(getDropdownItemsForAllEditors(application))
  }, [application])

  const setDefaultEditor = useCallback(
    (value: EditorOption['value']) => {
      setDefaultEditorIdentifier(value as FeatureIdentifier)

      if (mode === 'global') {
        void application.setPreference(PrefKey.DefaultEditorIdentifier, value)
      } else {
        void changePreferencesCallback({ editorIdentifier: value })
      }
    },
    [application, changePreferencesCallback, mode],
  )

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
        void application.setPreference(PrefKey.CustomNoteTitleFormat, newFormat)
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
            onChange={(value) => setDefaultEditor(value as EditorOption['value'])}
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
              className={classNames(
                'w-full min-w-55 rounded border border-solid border-passive-3 bg-default px-2 py-1.5 text-sm',
                'focus-within:ring-2 focus-within:ring-info',
              )}
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
