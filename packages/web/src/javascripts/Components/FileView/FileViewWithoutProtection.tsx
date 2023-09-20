import { ElementIds } from '@/Constants/ElementIDs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import FileOptionsPanel from '@/Components/FileContextMenu/FileOptionsPanel'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileViewProps } from './FileViewProps'
import MobileItemsListButton from '../NoteGroupView/MobileItemsListButton'
import LinkedItemsButton from '../LinkedItems/LinkedItemsButton'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import Popover from '../Popover/Popover'
import FilePreviewInfoPanel from '../FilePreview/FilePreviewInfoPanel'
import { useFileDragNDrop } from '../FileDragNDropProvider'
import RoundIconButton from '../Button/RoundIconButton'
import { useItemVaultInfo } from '@/Hooks/useItemVaultInfo'
import Icon from '../Icon/Icon'
import { VaultUserServiceEvent } from '@standardnotes/snjs'

const SyncTimeoutNoDebounceMs = 100
const SyncTimeoutDebounceMs = 350

const FileViewWithoutProtection = ({ application, file }: FileViewProps) => {
  const { vault } = useItemVaultInfo(file)

  const [isReadonly, setIsReadonly] = useState(false)
  useEffect(() => {
    if (!vault) {
      return
    }

    setIsReadonly(application.vaultUsers.isCurrentUserReadonlyVaultMember(vault))
  }, [application.vaultUsers, vault])
  useEffect(() => {
    return application.vaultUsers.addEventObserver((event, data) => {
      if (event === VaultUserServiceEvent.InvalidatedUserCacheForVault) {
        if ((data as string) !== vault?.sharing?.sharedVaultUuid) {
          return
        }
        setIsReadonly(vault ? application.vaultUsers.isCurrentUserReadonlyVaultMember(vault) : false)
      }
    })
  }, [application.vaultUsers, vault])

  const syncTimeoutRef = useRef<number>()
  const fileInfoButtonRef = useRef<HTMLButtonElement>(null)

  const [isFileInfoPanelOpen, setIsFileInfoPanelOpen] = useState(false)
  const toggleFileInfoPanel = () => {
    setIsFileInfoPanelOpen((show) => !show)
  }

  const onTitleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      const shouldNotDebounce = application.sessions.isSignedOut()
      const syncDebounceMs = shouldNotDebounce ? SyncTimeoutNoDebounceMs : SyncTimeoutDebounceMs

      syncTimeoutRef.current = window.setTimeout(async () => {
        await application.mutator.renameFile(file, event.target.value)
        void application.sync.sync()
      }, syncDebounceMs)
    },
    [application, file],
  )

  const fileDragTargetRef = useRef<HTMLDivElement>(null)

  const { addDragTarget, removeDragTarget } = useFileDragNDrop()

  useEffect(() => {
    const target = fileDragTargetRef.current

    if (target) {
      addDragTarget(target, {
        tooltipText: 'Drop your files to upload and link them to the current file',
        async callback(uploadedFile) {
          await application.linkingController.linkItems(uploadedFile, file)
        },
      })
    }

    return () => {
      if (target) {
        removeDragTarget(target)
      }
    }
  }, [addDragTarget, file, removeDragTarget, application.linkingController])

  return (
    <div className="sn-component section editor" aria-label="File" ref={fileDragTargetRef}>
      <div className="flex flex-col">
        {isReadonly && (
          <div className="bg-warning-faded relative flex items-center px-3.5 py-2 text-sm text-accessory-tint-3">
            <Icon type="pencil-off" className="mr-3" />
            This file is readonly
          </div>
        )}
        <div
          className="content-title-bar section-title-bar section-title-bar z-editor-title-bar w-full"
          id="file-title-bar"
        >
          <div className="flex h-8 items-center justify-between">
            <div className="flex flex-grow items-center">
              <MobileItemsListButton />
              <div className="title flex-grow overflow-auto">
                <input
                  className="input text-lg"
                  id={ElementIds.FileTitleEditor}
                  onChange={onTitleChange}
                  onFocus={(event) => {
                    event.target.select()
                  }}
                  spellCheck={false}
                  defaultValue={file.name}
                  autoComplete="off"
                  disabled={isReadonly}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isReadonly && <LinkedItemsButton linkingController={application.linkingController} />}
              <RoundIconButton
                label="File information panel"
                onClick={toggleFileInfoPanel}
                ref={fileInfoButtonRef}
                icon="info"
              />
              <Popover
                title="Details"
                open={isFileInfoPanelOpen}
                togglePopover={toggleFileInfoPanel}
                anchorElement={fileInfoButtonRef}
                side="bottom"
                align="center"
              >
                <FilePreviewInfoPanel file={file} />
              </Popover>
              <FileOptionsPanel itemListController={application.itemListController} />
            </div>
          </div>
          <div className="hidden md:flex">
            <LinkedItemBubblesContainer
              item={file}
              linkingController={application.linkingController}
              readonly={isReadonly}
            />
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-grow flex-col">
        <FilePreview file={file} application={application} key={file.uuid} />
      </div>
    </div>
  )
}

export default observer(FileViewWithoutProtection)
