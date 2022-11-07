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
import { SmartView, TagMutator } from '@standardnotes/snjs'
import { useRef, useState } from 'react'
import SmartViewPredicate from './SmartViewPredicate'

type Props = {
  application: WebApplication
  view: SmartView
  closeDialog: () => void
}

const EditSmartViewModal = ({ application, view, closeDialog }: Props) => {
  const [title, setTitle] = useState(view.title)
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(view.iconString)

  const [isSaving, setIsSaving] = useState(false)

  const [shouldShowIconPicker, setShouldShowIconPicker] = useState(false)
  const iconPickerButtonRef = useRef<HTMLButtonElement>(null)

  const toggleIconPicker = () => {
    setShouldShowIconPicker((shouldShow) => !shouldShow)
  }

  const saveSmartView = async () => {
    setIsSaving(true)
    await application.mutator.changeAndSaveItem<TagMutator>(view, (mutator) => {
      mutator.title = title
      mutator.iconString = selectedIcon || IconNameToSvgMapping.restore
    })
    setIsSaving(false)
    closeDialog()
  }

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeDialog}>Edit Smart View "{view.title}"</ModalDialogLabel>
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
          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold">Predicate:</div>
            <div>
              <SmartViewPredicate predicate={view.predicate} />
            </div>
          </div>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button disabled={isSaving} onClick={saveSmartView}>
          {isSaving ? <Spinner className="h-4.5 w-4.5" /> : 'Save'}
        </Button>
        <Button disabled={isSaving} onClick={closeDialog}>
          Cancel
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default EditSmartViewModal
