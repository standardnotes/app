import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants'
import { FunctionComponent, useCallback, useMemo } from 'react'
import { PopoverFileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FileItem } from '@standardnotes/snjs/dist/@types'

type Props = {
  closeMenu: () => void
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
  appState: AppState
  isFileAttachedToNote?: boolean
  renameToggleCallback?: (isRenamingFile: boolean) => void
  shouldShowRenameOption: boolean
  shouldShowAttachOption: boolean
}

const matchesCondition = (condition: (file: FileItem) => boolean, files: FileItem[]) => {
  const filesMatchingAttribute = files.filter(condition)
  const filesNotMatchingAttribute = files.filter((file) => !condition(file))
  return filesMatchingAttribute.length > filesNotMatchingAttribute.length
}

const FileMenuOptions: FunctionComponent<Props> = ({
  closeMenu,
  closeOnBlur,
  appState,
  isFileAttachedToNote,
  renameToggleCallback,
  shouldShowRenameOption,
  shouldShowAttachOption,
}) => {
  const { selectedFiles, handleFileAction } = appState.files

  const hasProtectedFiles = useMemo(() => matchesCondition((file) => file.protected, selectedFiles), [selectedFiles])

  const onPreview = useCallback(() => {
    handleFileAction({
      type: PopoverFileItemActionType.PreviewFile,
      payload: {
        file: selectedFiles[0],
        otherFiles: selectedFiles.length > 1 ? selectedFiles : appState.files.allFiles,
      },
    }).catch(console.error)
    closeMenu()
  }, [appState.files.allFiles, closeMenu, handleFileAction, selectedFiles])

  const onDetach = useCallback(() => {
    const file = selectedFiles[0]
    handleFileAction({
      type: PopoverFileItemActionType.DetachFileToNote,
      payload: { file },
    }).catch(console.error)
    closeMenu()
  }, [closeMenu, handleFileAction, selectedFiles])

  const onAttach = useCallback(() => {
    const file = selectedFiles[0]
    handleFileAction({
      type: PopoverFileItemActionType.AttachFileToNote,
      payload: { file },
    }).catch(console.error)
    closeMenu()
  }, [closeMenu, handleFileAction, selectedFiles])

  return (
    <>
      <button onBlur={closeOnBlur} className="sn-dropdown-item focus:bg-info-backdrop" onClick={onPreview}>
        <Icon type="file" className="mr-2 color-neutral" />
        Preview file
      </button>
      {selectedFiles.length === 1 && (
        <>
          {isFileAttachedToNote ? (
            <button onBlur={closeOnBlur} className="sn-dropdown-item focus:bg-info-backdrop" onClick={onDetach}>
              <Icon type="link-off" className="mr-2 color-neutral" />
              Detach from note
            </button>
          ) : shouldShowAttachOption ? (
            <button onBlur={closeOnBlur} className="sn-dropdown-item focus:bg-info-backdrop" onClick={onAttach}>
              <Icon type="link" className="mr-2 color-neutral" />
              Attach to note
            </button>
          ) : null}
        </>
      )}
      <div className="min-h-1px my-1 bg-border"></div>
      <button
        className="sn-dropdown-item justify-between focus:bg-info-backdrop"
        onClick={() => {
          appState.files.setProtectionForSelectedFiles(!hasProtectedFiles).catch(console.error)
        }}
        onBlur={closeOnBlur}
      >
        <span className="flex items-center">
          <Icon type="password" className="mr-2 color-neutral" />
          Password protection
        </span>
        <Switch
          className="px-0 pointer-events-none"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          checked={hasProtectedFiles}
        />
      </button>
      <div className="min-h-1px my-1 bg-border"></div>
      <button
        onBlur={closeOnBlur}
        className="sn-dropdown-item focus:bg-info-backdrop"
        onClick={() => {
          appState.files.downloadSelectedFiles().catch(console.error)
        }}
      >
        <Icon type="download" className="mr-2 color-neutral" />
        Download
      </button>
      {shouldShowRenameOption && (
        <button
          onBlur={closeOnBlur}
          className="sn-dropdown-item focus:bg-info-backdrop"
          onClick={() => {
            renameToggleCallback?.(true)
          }}
        >
          <Icon type="pencil" className="mr-2 color-neutral" />
          Rename
        </button>
      )}
      <button
        onBlur={closeOnBlur}
        className="sn-dropdown-item focus:bg-info-backdrop"
        onClick={() => {
          appState.files.deleteSelectedFilesPermanently().catch(console.error)
        }}
      >
        <Icon type="trash" className="mr-2 color-danger" />
        <span className="color-danger">Delete permanently</span>
      </button>
    </>
  )
}

export default observer(FileMenuOptions)
