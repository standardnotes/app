import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, KeyboardEventHandler, useCallback, useMemo, useRef, useState } from 'react'
import { getFileIconComponent } from './getFileIconComponent'
import Icon from '@/Components/Icon/Icon'
import FilePreviewInfoPanel from './FilePreviewInfoPanel'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { KeyboardKey } from '@standardnotes/ui-services'
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
import { classNames } from '@standardnotes/snjs'
import ModalOverlay from '../Modal/ModalOverlay'
import Modal from '../Modal/Modal'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

type Props = {
  application: WebApplication
}

const FilePreviewModal = observer(({ application }: Props) => {
  const { currentFile, setCurrentFile, otherFiles, dismiss } = application.filePreviewModalController

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

      const currentFileIndex = otherFiles.findIndex((file) => file.uuid === currentFile.uuid)

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
    return currentFile ? getFileIconComponent(getIconForFileType(currentFile.mimeType), 'w-6 h-6 flex-shrink-0') : null
  }, [currentFile])

  const focusElementOnMount = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus()
    }
  }, [])

  const handleRename = useCallback(async () => {
    if (!currentFile) {
      return null
    }
    if (renameInputRef.current) {
      const newName = renameInputRef.current.value
      if (newName && newName !== currentFile.name) {
        await application.mutator.renameFile(currentFile, newName)
        setIsRenaming(false)
        setCurrentFile(application.items.findSureItem(currentFile.uuid))
        return
      }
      setIsRenaming(false)
    }
  }, [application.items, application.mutator, currentFile, setCurrentFile])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const toggleOptionsMenu = () => setShowOptionsMenu((show) => !show)
  const closeOptionsMenu = () => setShowOptionsMenu(false)
  const toggleInfoPanel = () => setShowFileInfoPanel((show) => !show)
  const toggleLinkedBubblesContainer = () => setShowLinkedBubblesContainer((show) => !show)

  if (!currentFile) {
    return null
  }

  const vault = application.vaults.getItemVault(currentFile)
  const isReadonly = vault?.isSharedVaultListing() && application.vaultUsers.isCurrentUserReadonlyVaultMember(vault)

  return (
    <Modal
      title={currentFile.name}
      close={dismiss}
      actions={[
        {
          label: 'Done',
          type: 'primary',
          onClick: dismiss,
          hidden: !isMobileScreen,
          mobileSlot: 'right',
        },
        {
          label: 'Show file options',
          type: 'secondary',
          onClick: toggleOptionsMenu,
          hidden: !isMobileScreen,
        },
        {
          label: `${showFileInfoPanel ? 'Hide' : 'Show'} file info`,
          type: 'secondary',
          onClick: toggleInfoPanel,
          hidden: !isMobileScreen,
        },
        {
          label: `${showLinkedBubblesContainer ? 'Hide' : 'Show'} links section`,
          type: 'secondary',
          onClick: toggleLinkedBubblesContainer,
          hidden: !isMobileScreen,
        },
      ]}
      customHeader={<></>}
      disableCustomHeader={isMobileScreen}
    >
      <div
        className="flex h-full w-full flex-col focus:shadow-none focus:outline-none"
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
        onKeyDown={keyDownHandler}
        ref={focusElementOnMount}
      >
        <div className="hidden min-h-6 flex-shrink-0 flex-wrap items-center justify-between gap-2 border-0 border-b border-solid border-border px-4 py-3 focus:shadow-none md:flex">
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
                ref={mergeRefs([renameInputRef, focusElementOnMount])}
              />
            ) : (
              <span className="ml-3 font-medium">{currentFile.name}</span>
            )}
          </div>
          <div className="flex items-center">
            {!isReadonly && (
              <StyledTooltip label="Rename file" className="!z-modal">
                <button
                  className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                  onClick={() => setIsRenaming((isRenaming) => !isRenaming)}
                  aria-label="Rename file"
                >
                  <Icon type="pencil-filled" className="text-neutral" />
                </button>
              </StyledTooltip>
            )}
            <StyledTooltip label="Show linked items" className="!z-modal">
              <button
                className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                onClick={toggleLinkedBubblesContainer}
                aria-label="Show linked items"
              >
                <Icon type="link" className="text-neutral" />
              </button>
            </StyledTooltip>
            <StyledTooltip label="Show file options" className="!z-modal">
              <button
                className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                onClick={toggleOptionsMenu}
                ref={menuButtonRef}
                aria-label="Show file options"
              >
                <Icon type="more" className="text-neutral" />
              </button>
            </StyledTooltip>
            <Popover
              title="File options"
              open={showOptionsMenu}
              anchorElement={menuButtonRef}
              togglePopover={closeOptionsMenu}
              side="bottom"
              align="start"
              className="md:pb-2"
              overrideZIndex="z-modal"
            >
              <Menu a11yLabel="File context menu">
                <FileMenuOptions
                  selectedFiles={[currentFile]}
                  closeMenu={closeOptionsMenu}
                  shouldShowRenameOption={false}
                  shouldShowAttachOption={false}
                />
              </Menu>
            </Popover>
            <StyledTooltip label="Show file info" className="!z-modal">
              <button
                className="mr-4 flex cursor-pointer rounded border border-solid border-border bg-transparent p-1.5 hover:bg-contrast"
                onClick={toggleInfoPanel}
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
          <div className="-mt-1 min-h-0 flex-shrink-0 border-b border-border px-3.5 py-1.5">
            <LinkedItemBubblesContainer
              linkingController={application.linkingController}
              item={currentFile}
              readonly={isReadonly}
            />
          </div>
        )}
        <div className="flex min-h-0 flex-grow flex-col-reverse md:flex-row">
          <div
            className={classNames(
              'relative flex max-w-full flex-grow items-center justify-center',
              showFileInfoPanel && 'border-t border-border md:border-b-0 md:border-r',
            )}
          >
            <FilePreview file={currentFile} application={application} key={currentFile.uuid} />
          </div>
          {showFileInfoPanel && <FilePreviewInfoPanel file={currentFile} />}
        </div>
      </div>
    </Modal>
  )
})

FilePreviewModal.displayName = 'FilePreviewModal'

const FilePreviewModalWrapper: FunctionComponent<Props> = ({ application }) => {
  return (
    <ModalOverlay
      aria-label="File preview modal"
      isOpen={application.filePreviewModalController.isOpen}
      close={application.filePreviewModalController.dismiss}
      className="md:!h-full md:max-h-[90%] md:!w-full md:max-w-[90%]"
      autoFocusOnShow={false}
    >
      <FilePreviewModal application={application} />
    </ModalOverlay>
  )
}

export default observer(FilePreviewModalWrapper)
