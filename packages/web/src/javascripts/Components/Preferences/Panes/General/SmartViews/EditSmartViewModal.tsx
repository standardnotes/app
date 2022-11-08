import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import IconButton from '@/Components/Button/IconButton'
import Icon from '@/Components/Icon/Icon'
import { IconNameToSvgMapping } from '@/Components/Icon/IconNameToSvgMapping'
import IconPicker from '@/Components/Icon/IconPicker'
import Popover from '@/Components/Popover/Popover'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import Spinner from '@/Components/Spinner/Spinner'
import { SMART_TAGS_FEATURE_NAME } from '@/Constants/Constants'
import { FeaturesController } from '@/Controllers/FeaturesController'
import {
  AllPredicateCompoundOperators,
  CompoundPredicate,
  DecryptedItem,
  Predicate,
  SmartView,
  SNTag,
  TagMutator,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import { NonCompoundPredicateOperators } from './NonCompoundPredicateOperators'
import SmartViewEditableCompoundPredicate from './SmartViewEditableCompoundPredicate'
import SmartViewEditablePredicate from './SmartViewEditablePredicate'

type Props = {
  application: WebApplication
  featuresController: FeaturesController
  view: SmartView | SNTag
  closeDialog: () => void
}

const EditSmartViewModal = ({ application, featuresController, view, closeDialog }: Props) => {
  const isAddingNewSmartView = view instanceof SNTag && application.items.isTemplateItem(view)
  const [currentPredicate, setCurrentPredicate] = useState<
    Predicate<DecryptedItem> | CompoundPredicate<DecryptedItem> | undefined
  >(isAddingNewSmartView ? new Predicate('uuid', NonCompoundPredicateOperators[0], '') : undefined)

  const [title, setTitle] = useState(view.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const compoundOperatorSelectRef = useRef<HTMLSelectElement>(null)

  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(view.iconString)

  const [isSaving, setIsSaving] = useState(false)

  const [shouldShowIconPicker, setShouldShowIconPicker] = useState(false)
  const iconPickerButtonRef = useRef<HTMLButtonElement>(null)

  const toggleIconPicker = () => {
    setShouldShowIconPicker((shouldShow) => !shouldShow)
  }

  const saveSmartView = async () => {
    setIsSaving(true)

    const save = async () => {
      if (!title.length) {
        titleInputRef.current?.focus()
        return false
      }

      if (isAddingNewSmartView) {
        if (!featuresController.hasSmartViews) {
          void featuresController.showPremiumAlert(SMART_TAGS_FEATURE_NAME)
          return false
        }

        if (!currentPredicate) {
          return false
        }

        const smartView = await application.items.createSmartView(title, currentPredicate)

        if (!smartView) {
          return false
        }

        return true
      } else {
        const saved = await application.mutator.changeAndSaveItem<TagMutator>(view, (mutator) => {
          mutator.title = title
          mutator.iconString = selectedIcon || IconNameToSvgMapping.restore
        })
        return !!saved
      }
    }

    const didSave = await save()
    setIsSaving(false)

    if (didSave) {
      closeDialog()
    }
  }

  const close = () => {
    if (isAddingNewSmartView) {
      application.getViewControllerManager().navigationController.undoCreateNewTag()
    }
    closeDialog()
  }

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={close}>
        {isAddingNewSmartView ? 'Create Smart View' : `Edit Smart View "${view.title}"`}
      </ModalDialogLabel>
      <ModalDialogDescription>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-sm font-semibold">Title:</div>
            <input
              className="rounded border border-border py-1 px-2"
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
              <Icon type={selectedIcon || IconNameToSvgMapping.restore} />
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
                  selectedValue={selectedIcon || IconNameToSvgMapping.restore}
                  onIconChange={(value?: string | undefined) => {
                    setSelectedIcon(value)
                    toggleIconPicker()
                  }}
                  platform={application.platform}
                  useIconGrid={true}
                  portalDropdown={false}
                />
              </div>
            </Popover>
          </div>
          {currentPredicate && (
            <div className="flex flex-col gap-2.5">
              <div className="text-sm font-semibold">Predicate:</div>
              {currentPredicate instanceof CompoundPredicate ? (
                <SmartViewEditableCompoundPredicate
                  predicate={currentPredicate}
                  onPredicateChange={(predicate) => {
                    setCurrentPredicate(predicate)
                    console.log(predicate)
                  }}
                />
              ) : (
                <>
                  <SmartViewEditablePredicate
                    predicate={currentPredicate}
                    onPredicateChange={(predicate: Predicate<DecryptedItem>) => {
                      setCurrentPredicate(predicate)
                    }}
                  />
                  <div className="flex items-center justify-end gap-2.5">
                    <div role="separator" className="h-px flex-grow bg-border" />
                    <select
                      className="rounded border border-border bg-default py-1 px-2"
                      ref={compoundOperatorSelectRef}
                    >
                      {AllPredicateCompoundOperators.map((operator) => (
                        <option key={operator} value={operator}>
                          {operator}
                        </option>
                      ))}
                    </select>
                    <IconButton
                      icon="add"
                      className="rounded border border-border bg-default py-1 px-2"
                      onClick={() => {
                        if (!compoundOperatorSelectRef.current) {
                          return
                        }

                        const compoundOperator = compoundOperatorSelectRef.current.value as 'and' | 'or'

                        const newCompoundPredicate = new CompoundPredicate(compoundOperator, [
                          currentPredicate,
                          new Predicate('uuid', NonCompoundPredicateOperators[0], ''),
                        ])

                        setCurrentPredicate(newCompoundPredicate)
                      }}
                      title={'Add new predicate'}
                      focusable={true}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button disabled={isSaving} onClick={saveSmartView}>
          {isSaving ? <Spinner className="h-4.5 w-4.5" /> : 'Save'}
        </Button>
        <Button disabled={isSaving} onClick={close}>
          Cancel
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(EditSmartViewModal)
