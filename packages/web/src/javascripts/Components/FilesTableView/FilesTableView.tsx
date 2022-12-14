import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { FilesController } from '@/Controllers/FilesController'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { ContentType, FileItem, SortableItem, PrefKey, ApplicationEvent } from '@standardnotes/snjs'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import { getFileIconComponent } from '../FilePreview/getFileIconComponent'
import Popover from '../Popover/Popover'
import Table from '../Table/Table'
import { TableColumn } from '../Table/CommonTypes'
import { useTable } from '../Table/useTable'
import Menu from '../Menu/Menu'
import FileMenuOptions from '../FileContextMenu/FileMenuOptions'

type Props = {
  application: WebApplication
  filesController: FilesController
}

const FilesTableView = ({ application, filesController }: Props) => {
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
            <div className="flex items-center gap-2">
              {getFileIconComponent(getIconForFileType(file.mimeType), 'w-8 h-8 flex-shrink-0')}
              {file.title}
            </div>
          )
        },
      },
      {
        name: 'Modified',
        sortBy: 'userModifiedDate',
        cell: (file) => {
          return formatDateForContextMenu(file.userModifiedDate)
        },
      },
      {
        name: 'Size',
        cell: (file) => {
          return formatSizeToReadableString(file.decryptedSize)
        },
      },
    ],
    [],
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
