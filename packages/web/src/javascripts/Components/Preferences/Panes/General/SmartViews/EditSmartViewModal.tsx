import Icon from '@/Components/Icon/Icon'
import IconPicker from '@/Components/Icon/IconPicker'
import Popover from '@/Components/Popover/Popover'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import Spinner from '@/Components/Spinner/Spinner'
import { Platform, SmartViewDefaultIconName, VectorIconNameOrEmoji } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Delete',
        onClick: deleteView,
        disabled: isSaving,
        type: 'destructive',
      },
      {
        label: 'Cancel',
        onClick: closeDialog,
        disabled: isSaving,
        type: 'cancel',
        mobileSlot: 'left',
      },
      {
        label: isSaving ? <Spinner className="h-4.5 w-4.5" /> : 'Save',
        onClick: saveSmartView,
        disabled: isSaving,
        type: 'primary',
        mobileSlot: 'right',
      },
    ],
    [closeDialog, deleteView, isSaving, saveSmartView],
  )

  if (!view) {
    return null
  }

  return (
    <Modal title={`Edit Smart View "${view.title}"`} close={closeDialog} actions={modalActions}>
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
                    setIcon(value || SmartViewDefaultIconName)
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
            <div className="flex flex-grow flex-col overflow-hidden rounded-md border border-border">
              <textarea
                className="h-full min-h-[10rem] w-full flex-grow resize-none bg-default px-2.5 py-1.5 font-mono text-sm md:translucent-ui:bg-transparent"
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
      </div>
    </Modal>
  )
}

export default observer(EditSmartViewModal)
