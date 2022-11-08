import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
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
import { SmartView, SNTag, TagMutator } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'

type Props = {
  application: WebApplication
  featuresController: FeaturesController
  view: SmartView | SNTag
  closeDialog: () => void
}

const EditSmartViewModal = ({ application, featuresController, view, closeDialog }: Props) => {
  const isAddingNewSmartView = view instanceof SNTag && application.items.isTemplateItem(view)

  const [title, setTitle] = useState(view.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

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
