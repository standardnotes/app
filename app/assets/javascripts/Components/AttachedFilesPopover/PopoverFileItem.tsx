import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants'
import { KeyboardKey } from '@/Services/IOService'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { IconType, SNFile } from '@standardnotes/snjs'
import { FunctionComponent } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon, ICONS } from '@/Components/Icon'
import { PopoverFileItemAction, PopoverFileItemActionType } from './PopoverFileItemAction'
import { PopoverFileSubmenu } from './PopoverFileSubmenu'
import { useFilePreviewModal } from '@/Components/Files/FilePreviewModalProvider'

export const getFileIconComponent = (iconType: string, className: string) => {
  const IconComponent = ICONS[iconType as keyof typeof ICONS]

  return <IconComponent className={className} />
}

export type PopoverFileItemProps = {
  file: SNFile
  isAttachedToNote: boolean
  handleFileAction: (action: PopoverFileItemAction) => Promise<boolean>
  getIconType(type: string): IconType
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}

export const PopoverFileItem: FunctionComponent<PopoverFileItemProps> = ({
  file,
  isAttachedToNote,
  handleFileAction,
  getIconType,
  closeOnBlur,
}) => {
  const filePreviewModal = useFilePreviewModal()

  const [fileName, setFileName] = useState(file.name)
  const [isRenamingFile, setIsRenamingFile] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)
  const fileNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenamingFile) {
      fileNameInputRef.current?.focus()
    }
  }, [isRenamingFile])

  const renameFile = async (file: SNFile, name: string) => {
    await handleFileAction({
      type: PopoverFileItemActionType.RenameFile,
      payload: {
        file,
        name,
      },
    })
    setIsRenamingFile(false)
  }

  const handleFileNameInput = (event: Event) => {
    setFileName((event.target as HTMLInputElement).value)
  }

  const handleFileNameInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === KeyboardKey.Enter) {
      itemRef.current?.focus()
    }
  }

  const handleFileNameInputBlur = () => {
    renameFile(file, fileName).catch(console.error)
  }

  const clickHandler = () => {
    filePreviewModal.activate(file)
  }

  return (
    <div
      ref={itemRef}
      className="flex items-center justify-between p-3 focus:shadow-none"
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
    >
      <div onClick={clickHandler} className="flex items-center cursor-pointer">
        {getFileIconComponent(getIconType(file.mimeType), 'w-8 h-8 flex-shrink-0')}
        <div className="flex flex-col mx-4">
          {isRenamingFile ? (
            <input
              type="text"
              className="text-input px-1.5 py-1 mb-1 border-1 border-solid border-main bg-transparent color-foreground"
              value={fileName}
              ref={fileNameInputRef}
              onInput={handleFileNameInput}
              onKeyDown={handleFileNameInputKeyDown}
              onBlur={handleFileNameInputBlur}
            />
          ) : (
            <div className="text-sm mb-1 break-word">
              <span className="vertical-middle">{file.name}</span>
              {file.protected && (
                <Icon
                  type="lock-filled"
                  className="sn-icon--small ml-2 color-neutral vertical-middle"
                />
              )}
            </div>
          )}
          <div className="text-xs color-grey-0">
            {file.created_at.toLocaleString()} · {formatSizeToReadableString(file.size)}
          </div>
        </div>
      </div>
      <PopoverFileSubmenu
        file={file}
        isAttachedToNote={isAttachedToNote}
        handleFileAction={handleFileAction}
        setIsRenamingFile={setIsRenamingFile}
        closeOnBlur={closeOnBlur}
      />
    </div>
  )
}
