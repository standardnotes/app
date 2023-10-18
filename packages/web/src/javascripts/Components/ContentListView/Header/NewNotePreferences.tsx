import {
  NativeFeatureIdentifier,
  NewNoteTitleFormat,
  PrefKey,
  TagPreferences,
  isSmartView,
  isSystemView,
  SystemViewId,
  PrefDefaults,
  FeatureStatus,
  Uuid,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { WebApplication } from '@/Application/WebApplication'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'
import { PreferenceMode } from './PreferenceMode'
import { EditorOption, getDropdownItemsForAllEditors } from '@/Utils/DropdownItemsForEditors'
import { classNames } from '@standardnotes/utils'
import { NoteTitleFormatOptions } from './NoteTitleFormatOptions'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { getDayjsFormattedString } from '@/Utils/GetDayjsFormattedString'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'

const PrefChangeDebounceTimeInMs = 25

const HelpPageUrl = 'https://day.js.org/docs/en/display/format#list-of-all-available-formats'

type Props = {
  application: WebApplication
  selectedTag: AnyTag
  mode: PreferenceMode
  changePreferencesCallback: (properties: Partial<TagPreferences>) => Promise<void>
  disabled?: boolean
}

function CustomNoteTitleFormatPreview({ format }: { format: string }) {
  return <em>{getDayjsFormattedString(undefined, format)}</em>
}

const NewNotePreferences: FunctionComponent<Props> = ({
  application,
  selectedTag,
  mode,
  changePreferencesCallback,
  disabled,
}: Props) => {
  const premiumModal = usePremiumModal()

  const isSystemTag = isSmartView(selectedTag) && isSystemView(selectedTag)
  const selectedTagPreferences = isSystemTag
    ? application.getPreference(PrefKey.SystemViewPreferences)?.[selectedTag.uuid as SystemViewId]
    : selectedTag.preferences

  const [editorItems, setEditorItems] = useState<DropdownItem[]>([])
  const [defaultEditorIdentifier, setDefaultEditorIdentifier] = useState<string>(
    NativeFeatureIdentifier.TYPES.PlainEditor,
  )
  const [newNoteTitleFormat, setNewNoteTitleFormat] = useState<NewNoteTitleFormat>(
    NewNoteTitleFormat.CurrentDateAndTime,
  )
  const [customNoteTitleFormat, setCustomNoteTitleFormat] = useState('')

  const getGlobalEditorDefaultIdentifier = useCallback((): string => {
    return application.componentManager.getDefaultEditorIdentifier()
  }, [application])

  const reloadPreferences = useCallback(() => {
    if (mode === 'tag' && selectedTagPreferences?.editorIdentifier) {
      setDefaultEditorIdentifier(selectedTagPreferences?.editorIdentifier)
    } else {
      const globalDefault = getGlobalEditorDefaultIdentifier()
      setDefaultEditorIdentifier(globalDefault)
    }

    if (mode === 'tag' && selectedTagPreferences?.newNoteTitleFormat) {
      setNewNoteTitleFormat(selectedTagPreferences?.newNoteTitleFormat)
    } else {
      setNewNoteTitleFormat(
        application.getPreference(PrefKey.NewNoteTitleFormat, PrefDefaults[PrefKey.NewNoteTitleFormat]),
      )
    }
  }, [
    mode,
    selectedTagPreferences?.editorIdentifier,
    selectedTagPreferences?.newNoteTitleFormat,
    getGlobalEditorDefaultIdentifier,
    application,
  ])

  useEffect(() => {
    if (mode === 'tag' && selectedTagPreferences?.customNoteTitleFormat) {
      setCustomNoteTitleFormat(selectedTagPreferences?.customNoteTitleFormat)
    } else {
      setCustomNoteTitleFormat(
        application.getPreference(PrefKey.CustomNoteTitleFormat, PrefDefaults[PrefKey.CustomNoteTitleFormat]),
      )
    }
  }, [application, mode, selectedTag, selectedTagPreferences?.customNoteTitleFormat])

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
        const editorItem = editorItems.find((item) => item.value === value)
        if (editorItem) {
          premiumModal.activate(editorItem.label)
        }
        return
      }
      setDefaultEditorIdentifier(value)

      if (mode === 'global') {
        void application.setPreference(PrefKey.DefaultEditorIdentifier, value)
      } else {
        void changePreferencesCallback({ editorIdentifier: value })
      }
    },
    [application, mode, editorItems, premiumModal, changePreferencesCallback],
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
    <div className="px-3 py-3">
      <div>
        <div className="text-mobile-menu-item md:text-menu-item">Note Type</div>
        <div className="mt-2">
          <Dropdown
            disabled={disabled}
            fullWidth={true}
            label="Select the default note type"
            items={editorItems}
            value={defaultEditorIdentifier}
            onChange={(value) => selectEditorForNewNoteDefault(value as EditorOption['value'])}
          />
        </div>
      </div>
      <div>
        <div className="mt-3 text-mobile-menu-item md:text-menu-item">Title Format</div>
        <div className="mt-2">
          <Dropdown
            disabled={disabled}
            fullWidth={true}
            label="Select the format for the note title"
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
                'w-full min-w-55 rounded border border-solid border-passive-3 bg-default px-2 py-1.5 text-sm md:translucent-ui:bg-transparent',
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
              <CustomNoteTitleFormatPreview format={customNoteTitleFormat} />
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
  )
}

export default observer(NewNotePreferences)
