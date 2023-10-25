import { WebApplication } from '@/Application/WebApplication'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import {
  FileItem,
  SortableItem,
  PrefKey,
  FileBackupRecord,
  SystemViewId,
  DecryptedItemInterface,
  SNNote,
  TagMutator,
  isSystemView,
  isSmartView,
  isNote,
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
import LinkedItemBubble from '../LinkedItems/LinkedItemBubble'
import LinkedItemsPanel from '../LinkedItems/LinkedItemsPanel'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '../ApplicationProvider'
import { getIconAndTintForNoteType } from '@/Utils/Items/Icons/getIconAndTintForNoteType'
import NotesOptions from '../NotesOptions/NotesOptions'
import { useItemLinks } from '@/Hooks/useItemLinks'
import { ItemLink } from '@/Utils/Items/Search/ItemLink'
import ListItemVaultInfo from '../ContentListView/ListItemVaultInfo'

const ContextMenuCell = ({ items }: { items: DecryptedItemInterface[] }) => {
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
        title="File options"
        open={contextMenuVisible}
        anchorElement={anchorElementRef}
        togglePopover={() => {
          setContextMenuVisible(false)
        }}
        side="bottom"
        align="start"
        className="py-2"
      >
        <Menu a11yLabel="File context menu">
          {allItemsAreFiles && (
            <FileMenuOptions
              closeMenu={() => {
                setContextMenuVisible(false)
              }}
              shouldShowRenameOption={false}
              shouldShowAttachOption={false}
              selectedFiles={items as FileItem[]}
            />
          )}
          {allItemsAreNotes && (
            <NotesOptions
              notes={items as SNNote[]}
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

const ItemLinksCell = ({ item }: { item: DecryptedItemInterface }) => {
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
        title="Linked items"
        open={contextMenuVisible}
        anchorElement={anchorElementRef}
        togglePopover={() => {
          setContextMenuVisible(false)
        }}
        side="bottom"
        align="start"
        className="py-2"
      >
        <LinkedItemsPanel item={item} />
      </Popover>
    </>
  )
}

const ItemNameCell = ({ item, hideIcon }: { item: DecryptedItemInterface; hideIcon: boolean }) => {
  const application = useApplication()
  const [backupInfo, setBackupInfo] = useState<FileBackupRecord | undefined>(undefined)
  const isItemFile = item instanceof FileItem

  const editor = isNote(item) ? application.componentManager.editorForNote(item) : undefined
  const noteType = isNote(item) ? item.noteType : editor ? editor.noteType : undefined

  const [noteIcon, noteIconTint] = getIconAndTintForNoteType(noteType)

  useEffect(() => {
    if (isItemFile) {
      void application.fileBackups?.getFileBackupInfo(item).then(setBackupInfo)
    }
  }, [application, isItemFile, item])

  return (
    <div className="flex items-center gap-3 whitespace-normal">
      <span className="relative">
        {!hideIcon ? (
          isItemFile ? (
            getFileIconComponent(getIconForFileType(item.mimeType), 'w-6 h-6 flex-shrink-0')
          ) : (
            <Icon type={noteIcon} className={`text-accessory-tint-${noteIconTint}`} />
          )
        ) : null}
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
      <ListItemVaultInfo item={item} />
      {item.protected && (
        <span className="flex items-center" title="File is protected">
          <Icon ariaLabel="File is protected" type="lock-filled" className="h-3.5 w-3.5 text-passive-1" size="custom" />
        </span>
      )}
    </div>
  )
}

const AttachedToCell = ({ item }: { item: DecryptedItemInterface }) => {
  const { notesLinkedToItem, notesLinkingToItem, filesLinkedToItem, filesLinkingToItem, tagsLinkedToItem } =
    useItemLinks(item)
  const application = useApplication()

  const allLinks: ItemLink[] = (notesLinkedToItem as ItemLink[]).concat(
    notesLinkingToItem,
    filesLinkedToItem,
    filesLinkingToItem,
    tagsLinkedToItem,
  )

  if (!allLinks.length) {
    return null
  }

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <LinkedItemBubble
        className="overflow-hidden border border-transparent hover:border-border focus:border-info focus:shadow-none"
        link={allLinks[0]}
        key={allLinks[0].id}
        unlinkItem={async (itemToUnlink) => {
          void application.mutator.unlinkItems(item, itemToUnlink)
        }}
        isBidirectional={false}
      />
      {allLinks.length - 1 >= 1 && <span>and {allLinks.length - 1} more...</span>}
    </div>
  )
}

type Props = {
  application: WebApplication
  items: DecryptedItemInterface[]
}

const ContentTableView = ({ application, items }: Props) => {
  const listHasFiles = items.some((item) => item instanceof FileItem)

  const { sortBy, sortDirection } = application.itemListController.displayOptions
  const sortReversed = sortDirection === 'asc'
  const { hideDate, hideEditorIcon: hideIcon, hideTags } = application.itemListController.webDisplayOptions

  const onSortChange = useCallback(
    async (sortBy: keyof SortableItem, sortReversed: boolean) => {
      const selectedTag = application.navigationController.selected

      if (!selectedTag) {
        return
      }

      if (selectedTag.uuid === SystemViewId.Files) {
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

        return
      }

      const isNonFilesSystemView = isSmartView(selectedTag) && isSystemView(selectedTag)
      if (isNonFilesSystemView) {
        return
      }

      await application.changeAndSaveItem.execute<TagMutator>(selectedTag, (mutator) => {
        mutator.preferences = {
          ...mutator.preferences,
          sortBy,
          sortReverse: sortReversed,
        }
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
        cell: (item) => <ItemNameCell item={item} hideIcon={hideIcon} />,
      },
      {
        name: 'Upload date',
        sortBy: 'created_at',
        cell: (item) => {
          return formatDateForContextMenu(item.created_at)
        },
        hidden: isSmallBreakpoint || hideDate,
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
        hidden: isSmallBreakpoint || isMediumBreakpoint || isLargeBreakpoint || hideTags,
        cell: (item) => <AttachedToCell item={item} />,
      },
    ],
    [hideDate, hideIcon, hideTags, isLargeBreakpoint, isMediumBreakpoint, isSmallBreakpoint, listHasFiles],
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
        void application.filesController.handleFileAction({
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
      const vault = application.vaults.getItemVault(item)
      const isReadonly = vault?.isSharedVaultListing() && application.vaultUsers.isCurrentUserReadonlyVaultMember(vault)

      return (
        <div className="flex items-center gap-2">
          {!isReadonly && <ItemLinksCell item={item} />}
          <ContextMenuCell items={[item]} />
        </div>
      )
    },
    selectionActions: (itemIds) => <ContextMenuCell items={items.filter((item) => itemIds.includes(item.uuid))} />,
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
          title="Options"
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
            <Menu a11yLabel="File context menu">
              <FileMenuOptions
                closeMenu={closeContextMenu}
                shouldShowRenameOption={false}
                shouldShowAttachOption={false}
                selectedFiles={[contextMenuItem]}
              />
            </Menu>
          )}
          {contextMenuItem instanceof SNNote && (
            <Menu className="select-none" a11yLabel="Note context menu">
              <NotesOptions notes={[contextMenuItem]} closeMenu={closeContextMenu} />
            </Menu>
          )}
        </Popover>
      )}
    </>
  )
}
export default ContentTableView
