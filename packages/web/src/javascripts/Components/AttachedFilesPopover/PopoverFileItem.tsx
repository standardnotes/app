import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { KeyboardKey } from '@/Services/IOService'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { FileItem } from '@standardnotes/snjs'
import {
  FormEventHandler,
  FunctionComponent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import Icon from '@/Components/Icon/Icon'
import { PopoverFileItemActionType } from './PopoverFileItemAction'
import PopoverFileSubmenu from './PopoverFileSubmenu'
import { getFileIconComponent } from './getFileIconComponent'
import { PopoverFileItemProps } from './PopoverFileItemProps'

const PopoverFileItem: FunctionComponent<PopoverFileItemProps> = ({
  file,
  isAttachedToNote,
  handleFileAction,
  getIconType,
  closeOnBlur,
  previewHandler,
}) => {
  const [fileName, setFileName] = useState(file.name)
  const [isRenamingFile, setIsRenamingFile] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)
  const fileNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenamingFile) {
      fileNameInputRef.current?.focus()
    }
  }, [isRenamingFile])

  const renameFile = useCallback(
    async (file: FileItem, name: string) => {
      if (name.length < 1) {
        return
      }

      await handleFileAction({
        type: PopoverFileItemActionType.RenameFile,
        payload: {
          file,
          name,
        },
      })
      setIsRenamingFile(false)
    },
    [handleFileAction],
  )

  const handleFileNameInput: FormEventHandler<HTMLInputElement> = useCallback((event) => {
    setFileName((event.target as HTMLInputElement).value)
  }, [])

  const handleFileNameInputKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      if (fileName.length > 0 && event.key === KeyboardKey.Enter) {
        itemRef.current?.focus()
      }
    },
    [fileName.length],
  )

  const handleFileNameInputBlur = useCallback(() => {
    renameFile(file, fileName).catch(console.error)
  }, [file, fileName, renameFile])

  const handleClick = useCallback(() => {
    if (isRenamingFile) {
      return
    }

    previewHandler(file)
  }, [file, isRenamingFile, previewHandler])

  return (
    <div
      ref={itemRef}
      className="flex items-center justify-between p-3 focus:shadow-none"
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
    >
      <div onClick={handleClick} className="flex items-center cursor-pointer">
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
                <Icon type="lock-filled" className="sn-icon--small ml-2 color-neutral vertical-middle" />
              )}
            </div>
          )}
          <div className="text-xs color-passive-0">
            {file.created_at.toLocaleString()} · {formatSizeToReadableString(file.decryptedSize)}
          </div>
        </div>
      </div>
      <PopoverFileSubmenu
        file={file}
        isAttachedToNote={isAttachedToNote}
        handleFileAction={handleFileAction}
        setIsRenamingFile={setIsRenamingFile}
        closeOnBlur={closeOnBlur}
        previewHandler={previewHandler}
      />
    </div>
  )
}

export default PopoverFileItem
