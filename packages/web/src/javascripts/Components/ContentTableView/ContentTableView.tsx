import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { FilesController } from '@/Controllers/FilesController'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import {
  FileItem,
  SortableItem,
  PrefKey,
  ApplicationEvent,
  naturalSort,
  FileBackupRecord,
  SystemViewId,
  DecryptedItemInterface,
  SNNote,
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
import { getIconAndTintForNoteType } from '@/Utils/Items/Icons/getIconAndTintForNoteType'
import NotesOptions from '../NotesOptions/NotesOptions'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'

const ContextMenuCell = ({
  items,
  filesController,
  navigationController,
  linkingController,
  notesController,
  historyModalController,
}: {
  items: DecryptedItemInterface[]
  filesController: FilesController
  navigationController: NavigationController
  linkingController: LinkingController
  notesController: NotesController
  historyModalController: HistoryModalController
}) => {
  const application = useApplication()
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const anchorElementRef = useRef<HTMLButtonElement>(null)

  const allItemsAreNotes = useMemo(() => {
    return items.every((item) => item instanceof SNNote)
  }, [items])

  const allItemsAreFiles = useMemo(() => {
    return items.every((item) => item instanceof FileItem)
  }, [items])

  if (!allItemsAreNotes && !allItemsAreFiles) {
    return null
  }

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
          {allItemsAreFiles && (
            <FileMenuOptions
              linkingController={linkingController}
              navigationController={navigationController}
              closeMenu={() => {
                setContextMenuVisible(false)
              }}
              filesController={filesController}
              shouldShowRenameOption={false}
              shouldShowAttachOption={false}
              selectedFiles={items as FileItem[]}
            />
          )}
          {allItemsAreNotes && (
            <NotesOptions
              notes={items as SNNote[]}
              application={application}
              navigationController={navigationController}
              notesController={notesController}
              linkingController={linkingController}
              historyModalController={historyModalController}
              closeMenu={() => {
                setContextMenuVisible(false)
              }}
            />
          )}
        </Menu>
      </Popover>
    </>
  )
}

const ItemLinksCell = ({
  item,
  filesController,
  linkingController,
  featuresController,
}: {
  item: DecryptedItemInterface
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
          item={item}
        />
      </Popover>
    </>
  )
}

const ItemNameCell = ({ item }: { item: DecryptedItemInterface }) => {
  const application = useApplication()
  const [backupInfo, setBackupInfo] = useState<FileBackupRecord | undefined>(undefined)
  const isItemFile = item instanceof FileItem

  const noteType =
    item instanceof SNNote
      ? item.noteType || application.componentManager.editorForNote(item)?.package_info.note_type
      : undefined
  const [noteIcon, noteIconTint] = getIconAndTintForNoteType(noteType)

  useEffect(() => {
    if (isItemFile) {
      void application.fileBackups?.getFileBackupInfo(item).then(setBackupInfo)
    }
  }, [application, isItemFile, item])

  return (
    <div className="flex items-center gap-3 whitespace-normal">
      <span className="relative">
        {isItemFile ? (
          getFileIconComponent(getIconForFileType(item.mimeType), 'w-6 h-6 flex-shrink-0')
        ) : (
          <Icon type={noteIcon} className={`text-accessory-tint-${noteIconTint}`} />
        )}
        {backupInfo && (
          <div
            className="absolute bottom-1 right-1 translate-x-1/2 translate-y-1/2 rounded-full bg-default text-success"
            title="File is backed up locally"
          >
            <Icon size="small" type="check-circle-filled" />
          </div>
        )}
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">{item.title}</span>
      {item.protected && (
        <span className="flex items-center" title="File is protected">
          <Icon ariaLabel="File is protected" type="lock-filled" className="h-3.5 w-3.5 text-passive-1" size="custom" />
        </span>
      )}
    </div>
  )
}

type Props = {
  application: WebApplication
  items: DecryptedItemInterface[]
  filesController: FilesController
  featuresController: FeaturesController
  linkingController: LinkingController
  navigationController: NavigationController
  notesController: NotesController
  historyModalController: HistoryModalController
}

const ContentTableView = ({
  application,
  items,
  filesController,
  featuresController,
  linkingController,
  navigationController,
  notesController,
  historyModalController,
}: Props) => {
  const listHasFiles = items.some((item) => item instanceof FileItem)

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

  const [contextMenuItem, setContextMenuItem] = useState<DecryptedItemInterface | undefined>(undefined)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined)

  const isSmallBreakpoint = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const isMediumBreakpoint = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.md)
  const isLargeBreakpoint = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.lg)

  const columnDefs: TableColumn<DecryptedItemInterface>[] = useMemo(
    () => [
      {
        name: 'Name',
        sortBy: 'title',
        cell: (item) => <ItemNameCell item={item} />,
      },
      {
        name: 'Upload date',
        sortBy: 'created_at',
        cell: (item) => {
          return formatDateForContextMenu(item.created_at)
        },
        hidden: isSmallBreakpoint,
      },
      {
        name: 'Size',
        sortBy: 'decryptedSize',
        cell: (item) => {
          return item instanceof FileItem ? formatSizeToReadableString(item.decryptedSize) : null
        },
        hidden: isSmallBreakpoint || !listHasFiles,
      },
      {
        name: 'Attached to',
        hidden: isSmallBreakpoint || isMediumBreakpoint || isLargeBreakpoint,
        cell: (item) => {
          const links = [
            ...naturalSort(application.items.referencesForItem(item), 'title').map((item) =>
              createLinkFromItem(item, 'linked'),
            ),
            ...naturalSort(application.items.itemsReferencingItem(item), 'title').map((item) =>
              createLinkFromItem(item, 'linked-by'),
            ),
            ...application.items.getSortedTagsForItem(item).map((item) => createLinkFromItem(item, 'linked')),
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
                  void application.items.unlinkItems(item, itemToUnlink)
                }}
                isBidirectional={false}
              />
              {links.length - 1 > 1 && <span>and {links.length - 1} more...</span>}
            </div>
          )
        },
      },
    ],
    [application.items, isLargeBreakpoint, isMediumBreakpoint, isSmallBreakpoint, listHasFiles],
  )

  const getRowId = useCallback((item: DecryptedItemInterface) => item.uuid, [])

  const table = useTable({
    data: items,
    sortBy,
    sortReversed,
    onSortChange,
    getRowId,
    columns: columnDefs,
    enableRowSelection: true,
    enableMultipleRowSelection: true,
    onRowActivate(item) {
      if (item instanceof FileItem) {
        void filesController.handleFileAction({
          type: FileItemActionType.PreviewFile,
          payload: {
            file: item,
            otherFiles: items.filter((i) => i instanceof FileItem) as FileItem[],
          },
        })
      }
    },
    onRowContextMenu(x, y, file) {
      setContextMenuPosition({ x, y })
      setContextMenuItem(file)
    },
    rowActions: (item) => {
      return (
        <div className="flex items-center gap-2">
          <ItemLinksCell
            item={item}
            filesController={filesController}
            featuresController={featuresController}
            linkingController={linkingController}
          />
          <ContextMenuCell
            items={[item]}
            filesController={filesController}
            linkingController={linkingController}
            navigationController={navigationController}
            notesController={notesController}
            historyModalController={historyModalController}
          />
        </div>
      )
    },
    selectionActions: (itemIds) => (
      <ContextMenuCell
        items={items.filter((item) => itemIds.includes(item.uuid))}
        filesController={filesController}
        linkingController={linkingController}
        navigationController={navigationController}
        notesController={notesController}
        historyModalController={historyModalController}
      />
    ),
    showSelectionActions: true,
  })

  const closeContextMenu = () => {
    setContextMenuPosition(undefined)
    setContextMenuItem(undefined)
  }

  return (
    <>
      <Table table={table} />
      {contextMenuPosition && contextMenuItem && (
        <Popover
          open={true}
          anchorPoint={contextMenuPosition}
          togglePopover={() => {
            setContextMenuPosition(undefined)
            setContextMenuItem(undefined)
          }}
          side="bottom"
          align="start"
          className="py-2"
        >
          {contextMenuItem instanceof FileItem && (
            <Menu a11yLabel="File context menu" isOpen={true}>
              <FileMenuOptions
                closeMenu={closeContextMenu}
                filesController={filesController}
                shouldShowRenameOption={false}
                shouldShowAttachOption={false}
                selectedFiles={[contextMenuItem]}
                linkingController={linkingController}
                navigationController={navigationController}
              />
            </Menu>
          )}
          {contextMenuItem instanceof SNNote && (
            <Menu className="select-none" a11yLabel="Note context menu" isOpen={true}>
              <NotesOptions
                notes={[contextMenuItem]}
                application={application}
                navigationController={navigationController}
                notesController={notesController}
                linkingController={linkingController}
                historyModalController={historyModalController}
                closeMenu={closeContextMenu}
              />
            </Menu>
          )}
        </Popover>
      )}
    </>
  )
}
export default ContentTableView
