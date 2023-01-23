import { WebApplication } from '@/Application/Application'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import {
  ForwardedRef,
  forwardRef,
  FunctionComponent,
  KeyboardEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getFileIconComponent } from './getFileIconComponent'
import Icon from '@/Components/Icon/Icon'
import FilePreviewInfoPanel from './FilePreviewInfoPanel'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { KeyboardKey } from '@standardnotes/ui-services'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import FilePreview from './FilePreview'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import FileMenuOptions from '../FileContextMenu/FileMenuOptions'
import Menu from '../Menu/Menu'
import Popover from '../Popover/Popover'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import StyledTooltip from '../StyledTooltip/StyledTooltip'
import DecoratedInput from '../Input/DecoratedInput'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { useModalAnimation } from '../Shared/useModalAnimation'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const FilePreviewModal = observer(
  forwardRef(({ application, viewControllerManager }: Props, ref: ForwardedRef<HTMLDivElement>) => {
    const { currentFile, setCurrentFile, otherFiles, dismiss } = viewControllerManager.filePreviewModalController

    const [isRenaming, setIsRenaming] = useState(false)
    const renameInputRef = useRef<HTMLInputElement>(null)
    const [showLinkedBubblesContainer, setShowLinkedBubblesContainer] = useState(false)
    const [showOptionsMenu, setShowOptionsMenu] = useState(false)
    const [showFileInfoPanel, setShowFileInfoPanel] = useState(false)
    const menuButtonRef = useRef<HTMLButtonElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    const keyDownHandler: KeyboardEventHandler = useCallback(
      (event) => {
        if (!currentFile) {
          return null
        }

        const KeysToHandle: string[] = [KeyboardKey.Left, KeyboardKey.Right, KeyboardKey.Escape]

        if (!KeysToHandle.includes(event.key) || event.target === renameInputRef.current) {
          return
        }

        event.preventDefault()

        const currentFileIndex = otherFiles.findIndex((fileFromArray) => fileFromArray.uuid === currentFile.uuid)

        switch (event.key) {
          case KeyboardKey.Left: {
            const previousFileIndex = currentFileIndex - 1 >= 0 ? currentFileIndex - 1 : otherFiles.length - 1
            const previousFile = otherFiles[previousFileIndex]
            if (previousFile) {
              setCurrentFile(previousFile)
            }
            break
          }
          case KeyboardKey.Right: {
            const nextFileIndex = currentFileIndex + 1 < otherFiles.length ? currentFileIndex + 1 : 0
            const nextFile = otherFiles[nextFileIndex]
            if (nextFile) {
              setCurrentFile(nextFile)
            }
            break
          }
          case KeyboardKey.Escape:
            dismiss()
            break
        }
      },
      [currentFile, dismiss, otherFiles, setCurrentFile],
    )

    const IconComponent = useMemo(() => {
      return currentFile
        ? getFileIconComponent(getIconForFileType(currentFile.mimeType), 'w-6 h-6 flex-shrink-0')
        : null
    }, [currentFile])

    const focusInputOnMount = useCallback((input: HTMLInputElement | null) => {
      if (input) {
        input.focus()
      }
    }, [])

    const handleRename = useCallback(async () => {
      if (!currentFile) {
        return null
      }
      if (renameInputRef.current) {
        const newName = renameInputRef.current.value
        if (newName && newName !== currentFile.name) {
          await application.items.renameFile(currentFile, newName)
          setIsRenaming(false)
          setCurrentFile(application.items.findSureItem(currentFile.uuid))
          return
        }
        setIsRenaming(false)
      }
    }, [application.items, currentFile, setCurrentFile])

    if (!currentFile) {
      return null
    }

    return (
      <DialogOverlay
        className="sn-component p-0"
        aria-label="File preview modal"
        onDismiss={dismiss}
        initialFocusRef={closeButtonRef}
        dangerouslyBypassScrollLock
        ref={ref}
      >
        <DialogContent
          aria-label="File preview modal"
          className="m-0 flex h-full min-h-[90%] w-full min-w-[90%] flex-col rounded bg-[color:var(--modal-background-color)] p-0 shadow-main "
        >
          <div
            className="flex h-full w-full flex-col focus:shadow-none focus:outline-none"
            tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
            onKeyDown={keyDownHandler}
          >
            <div className="min-h-6 flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-0 border-b border-solid border-border px-4 py-3 focus:shadow-none">
              <div className="flex items-center">
                <div className="h-6 w-6">{IconComponent}</div>
                {isRenaming ? (
                  <DecoratedInput
                    defaultValue={currentFile.name}
                    className={{ container: 'ml-3', input: 'p-1', right: 'items-stretch !p-0' }}
                    onKeyDown={(event) => {
                      if (event.key === KeyboardKey.Enter) {
                        void handleRename()
                      }
                    }}
                    right={[
                      <button
                        className="flex h-full items-center justify-center border-l border-border px-2 py-1.5 text-neutral hover:bg-passive-4"
                        title="Submit"
                        onClick={handleRename}
                      >
                        <Icon type="check" size="small" />
                      </button>,
                    ]}
                    ref={mergeRefs([renameInputRef, focusInputOnMount])}
                  />
                ) : (
                  <span className="ml-3 font-medium">{currentFile.name}</span>
                )}
              </div>
              <div className="flex items-center">
                <StyledTooltip label="Rename file" className="!z-modal">
                  <button
                    className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                    onClick={() => setIsRenaming((isRenaming) => !isRenaming)}
                    aria-label="Rename file"
                  >
                    <Icon type="pencil-filled" className="text-neutral" />
                  </button>
                </StyledTooltip>
                <StyledTooltip label="Show linked items" className="!z-modal">
                  <button
                    className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                    onClick={() => setShowLinkedBubblesContainer((show) => !show)}
                    aria-label="Show linked items"
                  >
                    <Icon type="link" className="text-neutral" />
                  </button>
                </StyledTooltip>
                <StyledTooltip label="Show file options" className="!z-modal">
                  <button
                    className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                    onClick={() => setShowOptionsMenu((show) => !show)}
                    ref={menuButtonRef}
                    aria-label="Show file options"
                  >
                    <Icon type="more" className="text-neutral" />
                  </button>
                </StyledTooltip>
                <Popover
                  title="File options"
                  open={showOptionsMenu}
                  anchorElement={menuButtonRef.current}
                  togglePopover={() => {
                    setShowOptionsMenu(false)
                  }}
                  side="bottom"
                  align="start"
                  className="py-2"
                  overrideZIndex="z-modal"
                >
                  <Menu a11yLabel="File context menu" isOpen={showOptionsMenu}>
                    <FileMenuOptions
                      filesController={viewControllerManager.filesController}
                      linkingController={viewControllerManager.linkingController}
                      navigationController={viewControllerManager.navigationController}
                      selectedFiles={[currentFile]}
                      closeMenu={() => {
                        setShowOptionsMenu(false)
                      }}
                      shouldShowRenameOption={false}
                      shouldShowAttachOption={false}
                    />
                  </Menu>
                </Popover>
                <StyledTooltip label="Show file info" className="!z-modal">
                  <button
                    className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                    onClick={() => setShowFileInfoPanel((show) => !show)}
                    aria-label="Show file info"
                  >
                    <Icon type="info" className="text-neutral" />
                  </button>
                </StyledTooltip>
                <button
                  ref={closeButtonRef}
                  onClick={dismiss}
                  aria-label="Close modal"
                  className="flex cursor-pointer rounded border-0 bg-transparent p-1 hover:bg-contrast"
                >
                  <Icon type="close" className="text-neutral" />
                </button>
              </div>
            </div>
            {showLinkedBubblesContainer && (
              <div className="-mt-1 min-h-0 flex-shrink-0 border-b border-border py-1.5 px-3.5">
                <LinkedItemBubblesContainer
                  linkingController={viewControllerManager.linkingController}
                  item={currentFile}
                />
              </div>
            )}
            <div className="flex min-h-0 flex-grow">
              <div className="relative flex max-w-full flex-grow items-center justify-center">
                <FilePreview file={currentFile} application={application} key={currentFile.uuid} />
              </div>
              {showFileInfoPanel && <FilePreviewInfoPanel file={currentFile} />}
            </div>
          </div>
        </DialogContent>
      </DialogOverlay>
    )
  }),
)

FilePreviewModal.displayName = 'FilePreviewModal'

const FilePreviewModalWrapper: FunctionComponent<Props> = ({ application, viewControllerManager }) => {
  const [isMounted, setElement] = useModalAnimation(viewControllerManager.filePreviewModalController.isOpen)

  if (!isMounted) {
    return null
  }

  return <FilePreviewModal application={application} viewControllerManager={viewControllerManager} ref={setElement} />
}

export default observer(FilePreviewModalWrapper)
