import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import IconPicker from '@/Components/Icon/IconPicker'
import Popover from '@/Components/Popover/Popover'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import Spinner from '@/Components/Spinner/Spinner'
import { Platform } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import { AddSmartViewModalController } from './AddSmartViewModalController'

type Props = {
  controller: AddSmartViewModalController
  platform: Platform
}

const AddSmartViewModal = ({ controller, platform }: Props) => {
  const { isSaving, title, setTitle, icon, setIcon, closeModal } = controller

  const titleInputRef = useRef<HTMLInputElement>(null)

  const [shouldShowIconPicker, setShouldShowIconPicker] = useState(false)
  const iconPickerButtonRef = useRef<HTMLButtonElement>(null)

  const toggleIconPicker = () => {
    setShouldShowIconPicker((shouldShow) => !shouldShow)
  }

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeModal}>Add Smart View</ModalDialogLabel>
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
              <Icon type={icon || 'restore'} />
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
                  selectedValue={icon || 'restore'}
                  onIconChange={(value?: string | undefined) => {
                    setIcon(value ?? 'restore')
                    toggleIconPicker()
                  }}
                  platform={platform}
                  useIconGrid={true}
                  portalDropdown={false}
                />
              </div>
            </Popover>
          </div>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button
          disabled={isSaving}
          onClick={() => {
            //
          }}
        >
          {isSaving ? <Spinner className="h-4.5 w-4.5" /> : 'Save'}
        </Button>
        <Button disabled={isSaving} onClick={closeModal}>
          Cancel
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(AddSmartViewModal)
