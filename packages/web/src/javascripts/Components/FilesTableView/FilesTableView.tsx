import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { FilesController } from '@/Controllers/FilesController'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { ContentType, FileItem, SortableItem, PrefKey, ApplicationEvent } from '@standardnotes/snjs'
import { useState, useEffect, useCallback } from 'react'
import { PopoverFileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import { getFileIconComponent } from '../FilePreview/getFileIconComponent'
import Popover from '../Popover/Popover'
import Table, { clickableRowModifier, createTable, rowContextMenuModifier, rowStyleModifier } from '../Table/Table'

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

  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | undefined>(undefined)

  const table = createTable({
    data: files,
    sortBy,
    sortReversed,
    onSortChange,
    rowModifiers: [
      rowStyleModifier('underline'),
      clickableRowModifier((file) => {
        void filesController.handleFileAction({
          type: PopoverFileItemActionType.PreviewFile,
          payload: {
            file,
            otherFiles: [],
          },
        })
      }),
      rowContextMenuModifier((posX, posY, _file) => {
        setContextMenuPosition({ x: posX, y: posY })
      }),
    ],
    columns: [
      {
        name: 'Name',
        key: 'title',
        sortBy: 'title',
        cell: (file) => {
          return (
            <td key={file.title} className="py-2 px-3">
              <div className="flex items-center gap-2">
                {getFileIconComponent(getIconForFileType(file.mimeType), 'w-8 h-8 flex-shrink-0')}
                {file.title}
              </div>
            </td>
          )
        },
      },
      {
        name: 'Modified',
        key: 'userModifiedDate',
        sortBy: 'userModifiedDate',
        cell: (file) => {
          return (
            <td className="px-3" key={file.userModifiedDate.toString()}>
              {formatDateForContextMenu(file.userModifiedDate)}
            </td>
          )
        },
      },
      {
        name: 'Size',
        key: 'decryptedSize',
        cell: (file) => {
          return (
            <td className="px-3" key={file.decryptedSize}>
              {formatSizeToReadableString(file.decryptedSize)}
            </td>
          )
        },
      },
    ],
  })

  return (
    <>
      <Table table={table} />
      {contextMenuPosition && (
        <Popover
          open={true}
          anchorPoint={contextMenuPosition}
          togglePopover={() => {
            setContextMenuPosition(undefined)
          }}
          side="bottom"
          align="start"
        >
          <div className="py-2 px-3">Context menu</div>
        </Popover>
      )}
    </>
  )
}
export default FilesTableView
