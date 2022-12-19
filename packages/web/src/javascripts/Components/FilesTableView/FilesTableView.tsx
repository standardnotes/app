import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { FilesController } from '@/Controllers/FilesController'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { ContentType, FileItem, SortableItem, PrefKey, ApplicationEvent, naturalSort } from '@standardnotes/snjs'
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

const ContextMenuCell = ({ files, filesController }: { files: FileItem[]; filesController: FilesController }) => {
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

type Props = {
  application: WebApplication
  filesController: FilesController
  featuresController: FeaturesController
  linkingController: LinkingController
}

const FilesTableView = ({ application, filesController, featuresController, linkingController }: Props) => {
  const files = application.items
    .getDisplayableNotesAndFiles()
    .filter((item) => item.content_type === ContentType.File) as FileItem[]

  const [sortBy, setSortBy] = useState<keyof SortableItem>(
    application.getPreference(PrefKey.SortNotesBy, PrefDefaults[PrefKey.SortNotesBy]),
  )
  const [sortReversed, setSortReversed] = useState(
    application.getPreference(PrefKey.SortNotesReverse, PrefDefaults[PrefKey.SortNotesReverse]),
  )

  useEffect(() => {
    return application.addEventObserver(async (event) => {
      if (event === ApplicationEvent.PreferencesChanged) {
        setSortBy(application.getPreference(PrefKey.SortNotesBy, PrefDefaults[PrefKey.SortNotesBy]))
        setSortReversed(application.getPreference(PrefKey.SortNotesReverse, PrefDefaults[PrefKey.SortNotesReverse]))
      }
    })
  }, [application])

  const onSortChange = useCallback(
    async (sortBy: keyof SortableItem, sortReversed: boolean) => {
      await application.setPreference(PrefKey.SortNotesBy, sortBy)
      await application.setPreference(PrefKey.SortNotesReverse, sortReversed)
    },
    [application],
  )

  const [contextMenuFile, setContextMenuFile] = useState<FileItem | undefined>(undefined)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined)

  const columnDefs: TableColumn<FileItem>[] = useMemo(
    () => [
      {
        name: 'Name',
        sortBy: 'title',
        cell: (file) => {
          return (
            <div className="flex max-w-[40vw] items-center gap-3 whitespace-normal">
              {getFileIconComponent(getIconForFileType(file.mimeType), 'w-6 h-6 flex-shrink-0')}
              <span className="text-sm font-medium">{file.title}</span>
              {file.protected && (
                <span className="flex items-center" title="File is protected">
                  <Icon
                    ariaLabel="File is protected"
                    type="lock-filled"
                    className="h-3.5 w-3.5 text-passive-1"
                    size="custom"
                  />
                </span>
              )}
            </div>
          )
        },
      },
      {
        name: 'Upload date',
        sortBy: 'created_at',
        cell: (file) => {
          return formatDateForContextMenu(file.created_at)
        },
      },
      {
        name: 'Size',
        cell: (file) => {
          return formatSizeToReadableString(file.decryptedSize)
        },
      },
      {
        name: 'Attached to',
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
            <div className="flex max-w-76 flex-wrap gap-2">
              <LinkedItemBubble
                className="overflow-hidden"
                link={links[0]}
                key={links[0].id}
                unlinkItem={async (itemToUnlink) => {
                  void application.items.unlinkItems(file, itemToUnlink)
                }}
                isBidirectional={false}
              />
              {links.length > 1 && <span>and {links.length - 1} more...</span>}
            </div>
          )
        },
      },
    ],
    [application.items],
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
    onRowDoubleClick(file) {
      void filesController.handleFileAction({
        type: FileItemActionType.PreviewFile,
        payload: {
          file,
        },
      })
    },
    onRowContextMenu(x, y, file) {
      setContextMenuPosition({ x, y })
      setContextMenuFile(file)
    },
    rowActions: (file) => {
      const links = [
        ...naturalSort(application.items.referencesForItem(file), 'title').map((item) =>
          createLinkFromItem(item, 'linked'),
        ),
        ...naturalSort(application.items.itemsReferencingItem(file), 'title').map((item) =>
          createLinkFromItem(item, 'linked-by'),
        ),
        ...application.items.getSortedTagsForItem(file).map((item) => createLinkFromItem(item, 'linked')),
      ]

      return (
        <div className="flex items-center gap-2">
          {links.length > 0 && (
            <FileLinksCell
              file={file}
              filesController={filesController}
              featuresController={featuresController}
              linkingController={linkingController}
            />
          )}
          <ContextMenuCell files={[file]} filesController={filesController} />
        </div>
      )
    },
    selectionActions: (fileIds) => (
      <ContextMenuCell files={files.filter((file) => fileIds.includes(file.uuid))} filesController={filesController} />
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
            />
          </Menu>
        </Popover>
      )}
    </>
  )
}
export default FilesTableView
