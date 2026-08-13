import { FunctionComponent, useCallback, useMemo } from 'react'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Icon from '@/Components/Icon/Icon'
import { observer } from 'mobx-react-lite'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { AppPaneId } from '../Panes/AppPaneMetadata'
import MenuItem from '../Menu/MenuItem'
import { FileContextMenuBackupOption } from './FileContextMenuBackupOption'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import { FileItem } from '@standardnotes/snjs'
import AddTagOption from '../NotesOptions/AddTagOption'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import AddToVaultMenuOption from '../Vaults/AddToVaultMenuOption'
import { iconClass } from '../NotesOptions/ClassNames'
import { useApplication } from '../ApplicationProvider'
import MenuSection from '../Menu/MenuSection'
import { ToastType, addToast } from '@standardnotes/toast'
import { c } from 'ttag'

type Props = {
  closeMenu: () => void
  isFileAttachedToNote?: boolean
  renameToggleCallback?: (isRenamingFile: boolean) => void
  shouldShowRenameOption: boolean
  shouldShowAttachOption: boolean
  selectedFiles: FileItem[]
}

const FileMenuOptions: FunctionComponent<Props> = ({
  closeMenu,
  isFileAttachedToNote,
  renameToggleCallback,
  shouldShowRenameOption,
  shouldShowAttachOption,
  selectedFiles,
}) => {
  const application = useApplication()

  const { shouldUseStreamingAPI, handleFileAction } = application.filesController
  const { toggleAppPane } = useResponsiveAppPane()

  const hasProtectedFiles = useMemo(() => selectedFiles.some((file) => file.protected), [selectedFiles])
  const hasSelectedMultipleFiles = useMemo(() => selectedFiles.length > 1, [selectedFiles.length])
  const canShowZipDownloadOption = shouldUseStreamingAPI && hasSelectedMultipleFiles

  const totalFileSize = useMemo(
    () => selectedFiles.map((file) => file.decryptedSize).reduce((prev, next) => prev + next, 0),
    [selectedFiles],
  )

  const onDetach = useCallback(() => {
    const file = selectedFiles[0]
    void handleFileAction({
      type: FileItemActionType.DetachFileToNote,
      payload: { file },
    })
    closeMenu()
  }, [closeMenu, handleFileAction, selectedFiles])

  const onAttach = useCallback(() => {
    const file = selectedFiles[0]
    void handleFileAction({
      type: FileItemActionType.AttachFileToNote,
      payload: { file },
    })
    closeMenu()
  }, [closeMenu, handleFileAction, selectedFiles])

  const closeMenuAndToggleFilesList = useCallback(() => {
    toggleAppPane(AppPaneId.Items)
    closeMenu()
  }, [closeMenu, toggleAppPane])

  const areSomeFilesInReadonlySharedVault = selectedFiles.some((file) => {
    const vault = application.vaults.getItemVault(file)
    return vault?.isSharedVaultListing() && application.vaultUsers.isCurrentUserReadonlyVaultMember(vault)
  })
  const hasAdminPermissionForAllSharedFiles = selectedFiles.every((file) => {
    const vault = application.vaults.getItemVault(file)
    if (!vault?.isSharedVaultListing()) {
      return true
    }
    return application.vaultUsers.isCurrentUserSharedVaultAdmin(vault)
  })

  if (selectedFiles.length === 0) {
    return <div className="text-center">{c('B7.FilesSubscriptionHelp.Files.Info').t`No files selected`}</div>
  }

  return (
    <>
      {selectedFiles.length === 1 && (isFileAttachedToNote || shouldShowAttachOption) && (
        <MenuSection>
          {isFileAttachedToNote ? (
            <MenuItem onClick={onDetach}>
              <Icon type="link-off" className="mr-2 text-neutral" />
              {c('B7.FilesSubscriptionHelp.Files.Info').t`Detach from note`}
            </MenuItem>
          ) : shouldShowAttachOption ? (
            <MenuItem onClick={onAttach}>
              <Icon type="link" className="mr-2 text-neutral" />
              {c('B7.FilesSubscriptionHelp.Files.Info').t`Attach to note`}
            </MenuItem>
          ) : null}
        </MenuSection>
      )}
      <MenuSection>
        {application.featuresController.isVaultsEnabled() && (
          <AddToVaultMenuOption
            iconClassName={iconClass}
            items={selectedFiles}
            disabled={!hasAdminPermissionForAllSharedFiles}
          />
        )}
        <AddTagOption
          navigationController={application.navigationController}
          linkingController={application.linkingController}
          selectedItems={selectedFiles}
          iconClassName={`text-neutral mr-2 ${MenuItemIconSize}`}
          disabled={areSomeFilesInReadonlySharedVault}
        />
        <MenuSwitchButtonItem
          checked={hasProtectedFiles}
          onChange={(hasProtectedFiles) => {
            void application.filesController.setProtectionForFiles(hasProtectedFiles, selectedFiles)
          }}
          disabled={areSomeFilesInReadonlySharedVault}
        >
          <Icon type="lock" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
          {c('B7.FilesSubscriptionHelp.Files.Info').t`Password protect`}
        </MenuSwitchButtonItem>
      </MenuSection>
      <MenuSection>
        <MenuItem
          onClick={() => {
            void application.filesController.downloadFiles(selectedFiles)
            closeMenu()
          }}
        >
          <Icon type="download" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
          {c('B7.FilesSubscriptionHelp.Files.Action').t`Download`} {canShowZipDownloadOption ? 'separately' : ''}
        </MenuItem>
        {canShowZipDownloadOption && (
          <MenuItem
            onClick={() => {
              application.filesController.downloadFilesAsZip(selectedFiles).catch((error) => {
                if (error instanceof DOMException && error.name === 'AbortError') {
                  return
                }
                console.error(error)
                addToast({
                  type: ToastType.Error,
                  message:
                    error.message || c('B7.FilesSubscriptionHelp.Files.Error').t`Failed to download files as archive`,
                })
              })
              closeMenu()
            }}
          >
            <Icon type="download" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
            {c('B7.FilesSubscriptionHelp.Files.Action').t`Download as archive`}
          </MenuItem>
        )}
        {shouldShowRenameOption && (
          <MenuItem
            onClick={() => {
              renameToggleCallback?.(true)
            }}
            disabled={areSomeFilesInReadonlySharedVault}
          >
            <Icon type="pencil" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
            {c('B7.FilesSubscriptionHelp.Files.Info').t`Rename`}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            closeMenuAndToggleFilesList()
            void application.filesController.deleteFilesPermanently(selectedFiles)
          }}
          disabled={areSomeFilesInReadonlySharedVault}
        >
          <Icon type="trash" className={`mr-2 text-danger ${MenuItemIconSize}`} />
          <span className="text-danger">{c('B7.FilesSubscriptionHelp.Files.Action').t`Delete permanently`}</span>
        </MenuItem>
      </MenuSection>

      <FileContextMenuBackupOption file={selectedFiles[0]} />

      <div className="px-3 pb-0.5 pt-1 text-xs font-medium text-neutral">
        {!hasSelectedMultipleFiles && (
          <div className="mb-1">
            <span className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`File ID:`}</span>{' '}
            {selectedFiles[0].uuid}
          </div>
        )}
        <div>
          <span className="font-semibold">
            {hasSelectedMultipleFiles
              ? c('B7.FilesSubscriptionHelp.Files.Info').t`Total Size:`
              : c('B7.FilesSubscriptionHelp.Files.Info').t`Size:`}
          </span>{' '}
          {formatSizeToReadableString(totalFileSize)}
        </div>
      </div>
    </>
  )
}

export default observer(FileMenuOptions)
