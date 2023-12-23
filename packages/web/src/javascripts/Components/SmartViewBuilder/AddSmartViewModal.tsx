import CompoundPredicateBuilder from '@/Components/SmartViewBuilder/CompoundPredicateBuilder'
import Icon from '@/Components/Icon/Icon'
import IconPicker from '@/Components/Icon/IconPicker'
import Popover from '@/Components/Popover/Popover'
import Spinner from '@/Components/Spinner/Spinner'
import { Platform, SmartViewDefaultIconName, VectorIconNameOrEmoji } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AddSmartViewModalController } from './AddSmartViewModalController'
import TabPanel from '../Tabs/TabPanel'
import { useTabState } from '../Tabs/useTabState'
import TabsContainer from '../Tabs/TabsContainer'
import CopyableCodeBlock from '../Shared/CopyableCodeBlock'
import { classNames } from '@standardnotes/utils'
import Modal, { ModalAction } from '../Modal/Modal'
import { Disclosure, DisclosureContent, useDisclosureStore } from '@ariakit/react'

type Props = {
  controller: AddSmartViewModalController
  platform: Platform
}

const ConflictedNotesExampleCode = `{
  "keypath": "content.conflict_of.length",
  "operator": ">",
  "value": 0
}`

const ComplexCompoundExampleCode = `{
  "operator": "and",
  "value": [
    {
      "operator": "not",
      "value": {
        "keypath": "tags",
        "operator": "includes",
        "value": {
          "keypath": "title",
          "operator": "=",
          "value": "completed"
        }
      }
    },
    {
      "keypath": "tags",
      "operator": "includes",
      "value": {
        "keypath": "title",
        "operator": "=",
        "value": "todo"
      }
    }
  ]
}
`

const AddSmartViewModal = ({ controller, platform }: Props) => {
  const {
    isSaving,
    title,
    setTitle,
    icon,
    setIcon,
    closeModal,
    saveCurrentSmartView,
    predicateController,
    customPredicateJson,
    setCustomPredicateJson,
    isCustomJsonValidPredicate,
    setIsCustomJsonValidPredicate,
    validateAndPrettifyCustomPredicate,
  } = controller

  const titleInputRef = useRef<HTMLInputElement>(null)
  const customJsonInputRef = useRef<HTMLTextAreaElement>(null)

  const [shouldShowIconPicker, setShouldShowIconPicker] = useState(false)
  const iconPickerButtonRef = useRef<HTMLButtonElement>(null)

  const jsonExamplesDisclosure = useDisclosureStore()
  const showingJsonExamples = jsonExamplesDisclosure.useState('open')

  const toggleIconPicker = () => {
    setShouldShowIconPicker((shouldShow) => !shouldShow)
  }

  const tabState = useTabState({
    defaultTab: 'builder',
  })

  const save = useCallback(() => {
    if (!title.length) {
      titleInputRef.current?.focus()
      return
    }

    if (tabState.activeTab === 'custom' && !isCustomJsonValidPredicate) {
      validateAndPrettifyCustomPredicate()
      return
    }

    void saveCurrentSmartView()
  }, [
    isCustomJsonValidPredicate,
    saveCurrentSmartView,
    tabState.activeTab,
    title.length,
    validateAndPrettifyCustomPredicate,
  ])

  const canSave = tabState.activeTab === 'builder' || isCustomJsonValidPredicate

  useEffect(() => {
    if (!customJsonInputRef.current) {
      return
    }

    if (tabState.activeTab === 'custom' && isCustomJsonValidPredicate === false) {
      customJsonInputRef.current.focus()
    }
  }, [isCustomJsonValidPredicate, tabState.activeTab])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        onClick: closeModal,
        disabled: isSaving,
        type: 'cancel',
        mobileSlot: 'left',
      },
      {
        label: isSaving ? <Spinner className="h-4.5 w-4.5" /> : canSave ? 'Save' : 'Validate',
        onClick: save,
        disabled: isSaving,
        mobileSlot: 'right',
        type: 'primary',
      },
    ],
    [canSave, closeModal, isSaving, save],
  )

  return (
    <Modal title="Add Smart View" close={closeModal} actions={modalActions}>
      <div className="px-4 py-4">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-sm font-semibold">Title:</div>
            <input
              className="rounded border border-border bg-default px-2 py-1 md:translucent-ui:bg-transparent"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
              }}
              ref={titleInputRef}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="text-sm font-semibold">Icon:</div>
            <button
              className="rounded border border-border p-2"
              aria-label="Change icon"
              onClick={toggleIconPicker}
              ref={iconPickerButtonRef}
            >
              <Icon type={icon || SmartViewDefaultIconName} />
            </button>
            <Popover
              title="Choose icon"
              open={shouldShowIconPicker}
              anchorElement={iconPickerButtonRef}
              togglePopover={toggleIconPicker}
              align="start"
              overrideZIndex="z-modal"
            >
              <div className="p-2">
                <IconPicker
                  selectedValue={icon || SmartViewDefaultIconName}
                  onIconChange={(value?: VectorIconNameOrEmoji) => {
                    setIcon(value ?? SmartViewDefaultIconName)
                    toggleIconPicker()
                  }}
                  platform={platform}
                  useIconGrid={true}
                />
              </div>
            </Popover>
          </div>
          <div className="flex flex-grow flex-col gap-2.5">
            <div className="text-sm font-semibold">Predicate:</div>
            <TabsContainer
              className="flex flex-grow flex-col"
              tabs={[
                {
                  id: 'builder',
                  title: 'Builder',
                },
                {
                  id: 'custom',
                  title: 'Custom (JSON)',
                },
              ]}
              state={tabState}
            >
              <TabPanel state={tabState} id="builder" className="flex flex-col gap-2.5 p-4">
                <CompoundPredicateBuilder controller={predicateController} />
              </TabPanel>
              <TabPanel state={tabState} id="custom" className="flex flex-grow flex-col">
                <textarea
                  className="h-full min-h-[10rem] w-full flex-grow resize-none bg-default px-2.5 py-1.5 font-mono text-sm"
                  value={customPredicateJson}
                  onChange={(event) => {
                    setCustomPredicateJson(event.target.value)
                    setIsCustomJsonValidPredicate(undefined)
                  }}
                  spellCheck={false}
                  ref={customJsonInputRef}
                />
                {customPredicateJson && isCustomJsonValidPredicate === false && (
                  <div className="border-t border-border px-2.5 py-1.5 text-sm text-danger">
                    Invalid JSON. Double check your entry and try again.
                  </div>
                )}
              </TabPanel>
            </TabsContainer>
            {tabState.activeTab === 'custom' && (
              <div className="flex flex-col gap-1.5 rounded-md border-2 border-info-backdrop bg-info-backdrop px-4 py-3">
                <Disclosure
                  store={jsonExamplesDisclosure}
                  className="flex items-center justify-between focus:shadow-none focus:outline-none"
                >
                  <div className="text-sm font-semibold">Examples</div>
                  <Icon type={showingJsonExamples ? 'chevron-up' : 'chevron-down'} />
                </Disclosure>
                <DisclosureContent
                  store={jsonExamplesDisclosure}
                  className={classNames(showingJsonExamples && 'flex', 'flex-col gap-2.5')}
                >
                  <div className="text-sm font-medium">1. List notes that are conflicted copies of another note:</div>
                  <CopyableCodeBlock code={ConflictedNotesExampleCode} />
                  <div className="text-sm font-medium">
                    2. List notes that have the tag `todo` but not the tag `completed`:
                  </div>
                  <CopyableCodeBlock code={ComplexCompoundExampleCode} />
                </DisclosureContent>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default observer(AddSmartViewModal)
