import Dropdown from '@/Components/Dropdown/Dropdown'
import { Subtitle, Title } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { useApplication } from '@/Components/ApplicationProvider'
import { EditorOption, getDropdownItemsForAllEditors } from '@/Utils/DropdownItemsForEditors'
import {
  FeatureStatus,
  NativeFeatureIdentifier,
  NewNoteTitleFormat,
  PrefDefaults,
  PrefKey,
  Uuid,
  classNames,
} from '@standardnotes/snjs'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { NoteTitleFormatOptions } from '@/Components/ContentListView/Header/NoteTitleFormatOptions'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { getDayjsFormattedString } from '@/Utils/GetDayjsFormattedString'

const PrefChangeDebounceTimeInMs = 25
const HelpPageUrl = 'https://day.js.org/docs/en/display/format#list-of-all-available-formats'

const NewNoteDefaults = () => {
  const application = useApplication()
  const premiumModal = usePremiumModal()

  const [editorItems, setEditorItems] = useState<DropdownItem[]>([])
  useEffect(() => {
    setEditorItems(getDropdownItemsForAllEditors(application))
  }, [application])

  const [defaultEditorIdentifier, setDefaultEditorIdentifier] = useState<string>(
    NativeFeatureIdentifier.TYPES.PlainEditor,
  )
  const [newNoteTitleFormat, setNewNoteTitleFormat] = useState<NewNoteTitleFormat>(
    NewNoteTitleFormat.CurrentDateAndTime,
  )
  const [customNoteTitleFormat, setCustomNoteTitleFormat] = useState('')

  const reloadPreferences = useCallback(() => {
    const globalDefault = application.componentManager.getDefaultEditorIdentifier()
    setDefaultEditorIdentifier(globalDefault)

    setNewNoteTitleFormat(
      application.getPreference(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat]),
    )

    setCustomNoteTitleFormat(
      application.getPreference(PrefKey.CustomNoteTitleFormat, PrefDefaults[PrefKey.CustomNoteTitleFormat]),
    )
  }, [application])

  useEffect(() => {
    void reloadPreferences()
  }, [reloadPreferences])

  const selectEditorForNewNoteDefault = useCallback(
    (value: EditorOption['value']) => {
      let identifier: NativeFeatureIdentifier | Uuid | undefined = undefined

      const feature = NativeFeatureIdentifier.create(value)
      if (!feature.isFailed()) {
        identifier = feature.getValue()
      } else {
        const thirdPartyEditor = application.componentManager.findComponentWithPackageIdentifier(value)
        if (thirdPartyEditor) {
          identifier = Uuid.create(thirdPartyEditor.uuid).getValue()
        }
      }

      if (!identifier) {
        return
      }

      if (application.features.getFeatureStatus(identifier) !== FeatureStatus.Entitled) {
        if (feature.getValue().value === NativeFeatureIdentifier.TYPES.SuperEditor) {
          premiumModal.showSuperDemo()
          return
        }

        const editorItem = editorItems.find((item) => item.value === value)
        if (editorItem) {
          premiumModal.activate(editorItem.label)
        }
        return
      }
      setDefaultEditorIdentifier(value)

      void application.setPreference(PrefKey.DefaultEditorIdentifier, value)
    },
    [application, editorItems, premiumModal],
  )

  const setNewNoteTitleFormatChange = useCallback(
    (value: string) => {
      setNewNoteTitleFormat(value as NewNoteTitleFormat)
      void application.setPreference(PrefKey.NewNoteTitleFormat, value as NewNoteTitleFormat)
    },
    [application],
  )

  const debounceTimeoutRef = useRef<number>()

  const handleCustomFormatInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const newFormat = event.currentTarget.value
    setCustomNoteTitleFormat(newFormat)

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = window.setTimeout(async () => {
      void application.setPreference(PrefKey.CustomNoteTitleFormat, newFormat)
    }, PrefChangeDebounceTimeInMs)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>New Note Defaults</Title>
        <div className="mt-2">
          <div>
            <Subtitle>Note Type</Subtitle>
            <div className="mt-2">
              <Dropdown
                label="Select the default note type"
                items={editorItems}
                value={defaultEditorIdentifier}
                onChange={(value) => selectEditorForNewNoteDefault(value as EditorOption['value'])}
              />
            </div>
          </div>
          <HorizontalSeparator classes="my-4" />
          <div>
            <Subtitle>Title Format</Subtitle>
            <div className="mt-2">
              <Dropdown
                label="Select the format for the note title"
                items={NoteTitleFormatOptions}
                value={newNoteTitleFormat}
                onChange={setNewNoteTitleFormatChange}
              />
            </div>
            {newNoteTitleFormat === NewNoteTitleFormat.CustomFormat && (
              <div className="mt-2">
                <div className="mt-2">
                  <input
                    className={classNames(
                      'w-full min-w-55 rounded border border-solid border-passive-3 bg-default px-2 py-1.5 text-base md:w-auto md:translucent-ui:bg-transparent lg:text-sm',
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
                  <ErrorBoundary>
                    <em>{getDayjsFormattedString(undefined, customNoteTitleFormat)}</em>
                  </ErrorBoundary>
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
                        application.mobileDevice.openUrl(HelpPageUrl)
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
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default NewNoteDefaults
