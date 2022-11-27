import Button from '@/Components/Button/Button'
import CompoundPredicateBuilder from '@/Components/SmartViewBuilder/CompoundPredicateBuilder'
import Icon from '@/Components/Icon/Icon'
import IconPicker from '@/Components/Icon/IconPicker'
import Popover from '@/Components/Popover/Popover'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import Spinner from '@/Components/Spinner/Spinner'
import { Platform, SmartViewDefaultIconName, VectorIconNameOrEmoji } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { AddSmartViewModalController } from './AddSmartViewModalController'
import TabPanel from '../Tabs/TabPanel'
import { useTabState } from '../Tabs/useTabState'
import TabsContainer from '../Tabs/TabsContainer'
import CopyableCodeBlock from '../Shared/CopyableCodeBlock'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { classNames } from '@standardnotes/utils'

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

  const [shouldShowJsonExamples, setShouldShowJsonExamples] = useState(false)

  const toggleIconPicker = () => {
    setShouldShowIconPicker((shouldShow) => !shouldShow)
  }

  const tabState = useTabState({
    defaultTab: 'builder',
  })

  const save = () => {
    if (!title.length) {
      titleInputRef.current?.focus()
      return
    }

    if (tabState.activeTab === 'custom' && !isCustomJsonValidPredicate) {
      validateAndPrettifyCustomPredicate()
      return
    }

    void saveCurrentSmartView()
  }

  const canSave = tabState.activeTab === 'builder' || isCustomJsonValidPredicate

  useEffect(() => {
    if (!customJsonInputRef.current) {
      return
    }

    if (tabState.activeTab === 'custom' && isCustomJsonValidPredicate === false) {
      customJsonInputRef.current.focus()
    }
  }, [isCustomJsonValidPredicate, tabState.activeTab])

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeModal}>Add Smart View</ModalDialogLabel>
      <ModalDialogDescription>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-sm font-semibold">Title:</div>
            <input
              className="rounded border border-border bg-default py-1 px-2"
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
              open={shouldShowIconPicker}
              anchorElement={iconPickerButtonRef.current}
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
                  portalDropdown={false}
                />
              </div>
            </Popover>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-sm font-semibold">Predicate:</div>
            <TabsContainer
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
              <TabPanel state={tabState} id="custom" className="flex flex-col">
                <textarea
                  className="h-full min-h-[10rem] w-full flex-grow resize-none bg-default py-1.5 px-2.5 font-mono text-sm"
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
              <Disclosure open={shouldShowJsonExamples} onChange={() => setShouldShowJsonExamples((show) => !show)}>
                <div className="flex flex-col gap-1.5 rounded-md border-2 border-info-backdrop bg-info-backdrop py-3 px-4">
                  <DisclosureButton className="flex items-center justify-between focus:shadow-none focus:outline-none">
                    <div className="text-sm font-semibold">Examples</div>
                    <Icon type={shouldShowJsonExamples ? 'chevron-up' : 'chevron-down'} />
                  </DisclosureButton>
                  <DisclosurePanel className={classNames(shouldShowJsonExamples && 'flex', 'flex-col gap-2.5')}>
                    <div className="text-sm font-medium">1. List notes that are conflicted copies of another note:</div>
                    <CopyableCodeBlock code={ConflictedNotesExampleCode} />
                    <div className="text-sm font-medium">
                      2. List notes that have the tag `todo` but not the tag `completed`:
                    </div>
                    <CopyableCodeBlock code={ComplexCompoundExampleCode} />
                  </DisclosurePanel>
                </div>
              </Disclosure>
            )}
          </div>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button disabled={isSaving} onClick={closeModal} className="mr-auto">
          Cancel
        </Button>
        <Button disabled={isSaving} onClick={save} colorStyle={canSave ? 'info' : 'default'} primary={canSave}>
          {isSaving ? <Spinner className="h-4.5 w-4.5" /> : canSave ? 'Save' : 'Validate'}
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(AddSmartViewModal)
