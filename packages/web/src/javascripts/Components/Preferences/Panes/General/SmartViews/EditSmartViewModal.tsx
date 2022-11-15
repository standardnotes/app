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
import { useCallback, useEffect, useRef, useState } from 'react'
import { EditSmartViewModalController } from './EditSmartViewModalController'

type Props = {
  controller: EditSmartViewModalController
  platform: Platform
}

const EditSmartViewModal = ({ controller, platform }: Props) => {
  const {
    view,
    title,
    setTitle,
    predicateJson,
    setPredicateJson,
    isPredicateJsonValid,
    setIsPredicateJsonValid,
    icon,
    setIcon,
    save,
    isSaving,
    closeDialog,
    deleteView,
  } = controller

  const titleInputRef = useRef<HTMLInputElement>(null)
  const predicateJsonInputRef = useRef<HTMLTextAreaElement>(null)

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

    void save()
  }, [save, title.length])

  useEffect(() => {
    if (!predicateJsonInputRef.current) {
      return
    }

    if (isPredicateJsonValid === false) {
      predicateJsonInputRef.current.focus()
    }
  }, [isPredicateJsonValid])

  if (!view) {
    return null
  }

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeDialog}>Edit Smart View "{view.title}"</ModalDialogLabel>
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
                    setIcon(value || 'restore')
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
            <div className="flex flex-col overflow-hidden rounded-md border border-border">
              <textarea
                className="h-full min-h-[10rem] w-full flex-grow resize-none bg-default py-1.5 px-2.5 font-mono text-sm"
                value={predicateJson}
                onChange={(event) => {
                  setPredicateJson(event.target.value)
                  setIsPredicateJsonValid(true)
                }}
                spellCheck={false}
                ref={predicateJsonInputRef}
              />
              {!isPredicateJsonValid && (
                <div className="border-t border-border px-2.5 py-1.5 text-sm text-danger">
                  Invalid JSON. Double check your entry and try again.
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <Button className="mr-auto" disabled={isSaving} onClick={deleteView} colorStyle="danger">
          Delete
        </Button>
        <Button disabled={isSaving} onClick={saveSmartView} primary colorStyle="info">
          {isSaving ? <Spinner className="h-4.5 w-4.5" /> : 'Save'}
        </Button>
        <Button disabled={isSaving} onClick={closeDialog}>
          Cancel
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(EditSmartViewModal)
