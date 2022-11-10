import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import IconPicker from '@/Components/Icon/IconPicker'
import Popover from '@/Components/Popover/Popover'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import Spinner from '@/Components/Spinner/Spinner'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { SmartView, TagMutator } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useRef, useState } from 'react'

type Props = {
  application: WebApplication
  navigationController: NavigationController
  view: SmartView
  closeDialog: () => void
}

const EditSmartViewModal = ({ application, navigationController, view, closeDialog }: Props) => {
  const [title, setTitle] = useState(view.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(view.iconString)

  const [isSaving, setIsSaving] = useState(false)

  const [shouldShowIconPicker, setShouldShowIconPicker] = useState(false)
  const iconPickerButtonRef = useRef<HTMLButtonElement>(null)

  const toggleIconPicker = useCallback(() => {
    setShouldShowIconPicker((shouldShow) => !shouldShow)
  }, [])

  const saveSmartView = useCallback(async () => {
    if (!title.length) {
      titleInputRef.current?.focus()
      return
    }

    setIsSaving(true)

    await application.mutator.changeAndSaveItem<TagMutator>(view, (mutator) => {
      mutator.title = title
      mutator.iconString = selectedIcon || 'restore'
    })

    setIsSaving(false)
    closeDialog()
  }, [application.mutator, closeDialog, selectedIcon, title, view])

  const deleteSmartView = useCallback(async () => {
    void navigationController.remove(view, true)
    closeDialog()
  }, [closeDialog, navigationController, view])

  const close = useCallback(() => {
    closeDialog()
  }, [closeDialog])

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={close}>Edit Smart View "{view.title}"</ModalDialogLabel>
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
              <Icon type={selectedIcon || 'restore'} />
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
                  selectedValue={selectedIcon || 'restore'}
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
        <Button className="mr-auto" disabled={isSaving} onClick={deleteSmartView} colorStyle="danger">
          Delete
        </Button>
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
