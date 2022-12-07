import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { ContentType, FileItem, SortableItem, PrefKey, ApplicationEvent } from '@standardnotes/snjs'
import { useState, useEffect, useCallback } from 'react'
import { getFileIconComponent } from '../FilePreview/getFileIconComponent'
import Table, { createTable } from '../Table/Table'

type Props = {
  application: WebApplication
}

const FilesTableView = ({ application }: Props) => {
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

  const table = createTable({
    data: files,
    sortBy,
    sortReversed,
    onSortChange,
    columns: [
      {
        name: 'Name',
        key: 'title',
        sortBy: 'title',
        cell: (file) => {
          return (
            <td key={file.title} className="py-2">
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
          return <td key={file.userModifiedDate.toString()}>{formatDateForContextMenu(file.userModifiedDate)}</td>
        },
      },
      {
        name: 'Size',
        key: 'decryptedSize',
        cell: (file) => {
          return <td key={file.decryptedSize}>{formatSizeToReadableString(file.decryptedSize)}</td>
        },
      },
    ],
  })

  return <Table table={table} />
}
export default FilesTableView
