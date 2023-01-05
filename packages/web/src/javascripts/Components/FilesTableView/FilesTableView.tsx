import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { FilesController } from '@/Controllers/FilesController'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import {
  ContentType,
  FileItem,
  SortableItem,
  PrefKey,
  ApplicationEvent,
  naturalSort,
  FileBackupRecord,
  SystemViewId,
} from '@standardnotes/snjs'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import { getFileIconComponent } from '../FilePreview/getFileIconComponent'
import Popover from '../Popover/Popover'
import Table from '../Table/Table'
import { TableColumn } from '../Table/CommonTypes'
import { useTable } from '../Table/useTable'
import Menu from '../Menu/Menu'
import FileMenuOptions from '../FileContextMenu/FileMenuOptions'
import Icon from '../Icon/Icon'
import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'
import LinkedItemBubble from '../LinkedItems/LinkedItemBubble'
import LinkedItemsPanel from '../LinkedItems/LinkedItemsPanel'
import { LinkingController } from '@/Controllers/LinkingController'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '../ApplicationProvider'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'

const ContextMenuCell = ({
  files,
  filesController,
  navigationController,
  linkingController,
}: {
  files: FileItem[]
  filesController: FilesController
  navigationController: NavigationController
  linkingController: LinkingController
}) => {
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const anchorElementRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        className="rounded-full border border-border bg-default p-1"
        ref={anchorElementRef}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setContextMenuVisible((visible) => !visible)
        }}
      >
        <Icon type="more" />
      </button>
      <Popover
        open={contextMenuVisible}
        anchorElement={anchorElementRef.current}
        togglePopover={() => {
          setContextMenuVisible(false)
        }}
        side="bottom"
        align="start"
        className="py-2"
      >
        <Menu a11yLabel="File context menu" isOpen={contextMenuVisible}>
          <FileMenuOptions
            linkingController={linkingController}
            navigationController={navigationController}
            closeMenu={() => {
              setContextMenuVisible(false)
            }}
            filesController={filesController}
            shouldShowRenameOption={false}
            shouldShowAttachOption={false}
            selectedFiles={files}
          />
        </Menu>
      </Popover>
    </>
  )
}

const FileLinksCell = ({
  file,
  filesController,
  linkingController,
  featuresController,
}: {
  file: FileItem
  filesController: FilesController
  linkingController: LinkingController
  featuresController: FeaturesController
}) => {
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const anchorElementRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        className="rounded-full border border-border bg-default p-1"
        ref={anchorElementRef}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setContextMenuVisible((visible) => !visible)
        }}
      >
        <Icon type="link" />
      </button>
      <Popover
        open={contextMenuVisible}
        anchorElement={anchorElementRef.current}
        togglePopover={() => {
          setContextMenuVisible(false)
        }}
        side="bottom"
        align="start"
        className="py-2"
      >
        <LinkedItemsPanel
          linkingController={linkingController}
          filesController={filesController}
          featuresController={featuresController}
          isOpen={contextMenuVisible}
          item={file}
        />
      </Popover>
    </>
  )
}

const FileNameCell = ({ file }: { file: FileItem }) => {
  const application = useApplication()
  const [backupInfo, setBackupInfo] = useState<FileBackupRecord | undefined>(undefined)

  useEffect(() => {
    void application.fileBackups?.getFileBackupInfo(file).then(setBackupInfo)
  }, [application, file])

  return (
    <div className="flex items-center gap-3 whitespace-normal">
      <span className="relative">
        {getFileIconComponent(getIconForFileType(file.mimeType), 'w-6 h-6 flex-shrink-0')}
        {backupInfo && (
          <div
            className="absolute bottom-1 right-1 translate-x-1/2 translate-y-1/2 rounded-full bg-default text-success"
            title="File is backed up locally"
          >
            <Icon size="small" type="check-circle-filled" />
          </div>
        )}
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">{file.title}</span>
      {file.protected && (
        <span className="flex items-center" title="File is protected">
          <Icon ariaLabel="File is protected" type="lock-filled" className="h-3.5 w-3.5 text-passive-1" size="custom" />
        </span>
      )}
    </div>
  )
}

type Props = {
  application: WebApplication
  filesController: FilesController
  featuresController: FeaturesController
  linkingController: LinkingController
  navigationController: NavigationController
}

const FilesTableView = ({
  application,
  filesController,
  featuresController,
  linkingController,
  navigationController,
}: Props) => {
  const files = application.items
    .getDisplayableNotesAndFiles()
    .filter((item) => item.content_type === ContentType.File) as FileItem[]

  const getSortByPreference = useCallback(() => {
    const globalPrefValue = application.getPreference(PrefKey.SortNotesBy, PrefDefaults[PrefKey.SortNotesBy])
    const filesViewPrefValue = application.getPreference(PrefKey.SystemViewPreferences)?.[SystemViewId.Files]?.sortBy

    return filesViewPrefValue ?? globalPrefValue
  }, [application])

  const getSortReversedPreference = useCallback(() => {
    const globalPrefValue = application.getPreference(PrefKey.SortNotesReverse, PrefDefaults[PrefKey.SortNotesReverse])
    const filesViewPrefValue = application.getPreference(PrefKey.SystemViewPreferences)?.[SystemViewId.Files]
      ?.sortReverse

    return filesViewPrefValue ?? globalPrefValue
  }, [application])

  const [sortBy, setSortBy] = useState<keyof SortableItem>(() => getSortByPreference())
  const [sortReversed, setSortReversed] = useState(() => getSortReversedPreference())

  useEffect(() => {
    return application.addEventObserver(async (event) => {
      if (event === ApplicationEvent.PreferencesChanged) {
        setSortBy(getSortByPreference())
        setSortReversed(getSortReversedPreference())
      }
    })
  }, [application, getSortByPreference, getSortReversedPreference])

  const onSortChange = useCallback(
    async (sortBy: keyof SortableItem, sortReversed: boolean) => {
      const systemViewPreferences = application.getPreference(PrefKey.SystemViewPreferences) || {}
      const filesViewPreferences = systemViewPreferences[SystemViewId.Files] || {}

      await application.setPreference(PrefKey.SystemViewPreferences, {
        ...systemViewPreferences,
        [SystemViewId.Files]: {
          ...filesViewPreferences,
          sortBy,
          sortReverse: sortReversed,
        },
      })
    },
    [application],
  )

  const [contextMenuFile, setContextMenuFile] = useState<FileItem | undefined>(undefined)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined)

  const isSmallBreakpoint = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const isMediumBreakpoint = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.md)
  const isLargeBreakpoint = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.lg)

  const columnDefs: TableColumn<FileItem>[] = useMemo(
    () => [
      {
        name: 'Name',
        sortBy: 'title',
        cell: (file) => <FileNameCell file={file} />,
      },
      {
        name: 'Upload date',
        sortBy: 'created_at',
        cell: (file) => {
          return formatDateForContextMenu(file.created_at)
        },
        hidden: isSmallBreakpoint,
      },
      {
        name: 'Size',
        sortBy: 'decryptedSize',
        cell: (file) => {
          return formatSizeToReadableString(file.decryptedSize)
        },
        hidden: isSmallBreakpoint,
      },
      {
        name: 'Attached to',
        hidden: isSmallBreakpoint || isMediumBreakpoint || isLargeBreakpoint,
        cell: (file) => {
          const links = [
            ...naturalSort(application.items.referencesForItem(file), 'title').map((item) =>
              createLinkFromItem(item, 'linked'),
            ),
            ...naturalSort(application.items.itemsReferencingItem(file), 'title').map((item) =>
              createLinkFromItem(item, 'linked-by'),
            ),
            ...application.items.getSortedTagsForItem(file).map((item) => createLinkFromItem(item, 'linked')),
          ]

          if (!links.length) {
            return null
          }

          return (
            <div className="flex items-center gap-2 overflow-hidden">
              <LinkedItemBubble
                className="overflow-hidden border border-transparent hover:border-border focus:border-info focus:shadow-none"
                link={links[0]}
                key={links[0].id}
                unlinkItem={async (itemToUnlink) => {
                  void application.items.unlinkItems(file, itemToUnlink)
                }}
                isBidirectional={false}
              />
              {links.length - 1 > 1 && <span>and {links.length - 1} more...</span>}
            </div>
          )
        },
      },
    ],
    [application.items, isLargeBreakpoint, isMediumBreakpoint, isSmallBreakpoint],
  )

  const getRowId = useCallback((file: FileItem) => file.uuid, [])

  const table = useTable({
    data: files,
    sortBy,
    sortReversed,
    onSortChange,
    getRowId,
    columns: columnDefs,
    enableRowSelection: true,
    enableMultipleRowSelection: true,
    onRowActivate(file) {
      void filesController.handleFileAction({
        type: FileItemActionType.PreviewFile,
        payload: {
          file,
          otherFiles: files,
        },
      })
    },
    onRowContextMenu(x, y, file) {
      setContextMenuPosition({ x, y })
      setContextMenuFile(file)
    },
    rowActions: (file) => {
      return (
        <div className="flex items-center gap-2">
          <FileLinksCell
            file={file}
            filesController={filesController}
            featuresController={featuresController}
            linkingController={linkingController}
          />
          <ContextMenuCell
            files={[file]}
            filesController={filesController}
            linkingController={linkingController}
            navigationController={navigationController}
          />
        </div>
      )
    },
    selectionActions: (fileIds) => (
      <ContextMenuCell
        files={files.filter((file) => fileIds.includes(file.uuid))}
        filesController={filesController}
        linkingController={linkingController}
        navigationController={navigationController}
      />
    ),
    showSelectionActions: true,
  })

  return (
    <>
      <Table table={table} />
      {contextMenuPosition && contextMenuFile && (
        <Popover
          open={true}
          anchorPoint={contextMenuPosition}
          togglePopover={() => {
            setContextMenuPosition(undefined)
            setContextMenuFile(undefined)
          }}
          side="bottom"
          align="start"
          className="py-2"
        >
          <Menu a11yLabel="File context menu" isOpen={true}>
            <FileMenuOptions
              closeMenu={() => {
                setContextMenuPosition(undefined)
                setContextMenuFile(undefined)
              }}
              filesController={filesController}
              shouldShowRenameOption={false}
              shouldShowAttachOption={false}
              selectedFiles={[contextMenuFile]}
              linkingController={linkingController}
              navigationController={navigationController}
            />
          </Menu>
        </Popover>
      )}
    </>
  )
}
export default FilesTableView
