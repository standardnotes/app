import { WebApplication } from '@/Application/Application'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { FilesController } from '@/Controllers/FilesController'
import { formatDateForContextMenu } from '@/Utils/DateUtils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { ApplicationEvent, ContentType, FileItem, PrefKey, SortableItem } from '@standardnotes/snjs'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { getFileIconComponent } from '../FilePreview/getFileIconComponent'

type SortBy = keyof SortableItem

type Column<Data> = {
  name: string
  key: keyof Data
  sortBy?: SortBy
  cell: (data: Data) => ReactNode
}

type TableSortOptions =
  | {
      sortBy: SortBy
      sortReversed: boolean
      onSortChange: (sortBy: SortBy, reversed: boolean) => void
    }
  | {
      sortBy?: never
      sortReversed?: never
      onSortChange?: never
    }

type CreateTableOptions<Data> = {
  data: Data[]
  columns: Column<Data>[]
} & TableSortOptions

function createTable<Data>(options: CreateTableOptions<Data>) {
  const headers = options.columns.map((column) => {
    return {
      name: column.name,
      key: column.key,
      isSorting: options.sortBy && options.sortBy === column.sortBy,
      sortBy: column.sortBy,
      sortReversed: options.sortReversed,
      onSortChange: () => {
        if (!options.onSortChange || !column.sortBy) {
          return
        }
        options.onSortChange(column.sortBy, options.sortBy === column.sortBy ? !options.sortReversed : false)
      },
    }
  })

  const rows = options.data.map((data) => {
    const cells = options.columns.map((column) => {
      return {
        node: column.cell(data),
        key: data[column.key],
      }
    })
    return cells
  })

  return {
    headers,
    rows,
  }
}

const Table = ({ application }: { application: WebApplication; filesController: FilesController }) => {
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
            <div className="flex items-center gap-2">
              {getFileIconComponent(getIconForFileType(file.mimeType), 'w-8 h-8 flex-shrink-0')}
              {file.title}
            </div>
          )
        },
      },
      {
        name: 'Modified',
        key: 'userModifiedDate',
        sortBy: 'userModifiedDate',
        cell: (file) => {
          return <>{formatDateForContextMenu(file.userModifiedDate)}</>
        },
      },
      {
        name: 'Size',
        key: 'decryptedSize',
        cell: (file) => {
          return <>{formatSizeToReadableString(file.decryptedSize)}</>
        },
      },
    ],
  })

  return (
    <table className="block min-h-0 overflow-auto">
      <thead>
        <tr>
          {table.headers.map((header) => {
            return (
              <th onClick={header.onSortChange} key={header.key}>
                {header.name}
                {header.isSorting && <>{header.sortReversed ? '▼' : '▲'}</>}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody className="whitespace-nowrap">
        {table.rows.map((row, index) => {
          return (
            <tr key={index}>
              {row.map((cell) => {
                return <td key={cell.key?.toString()}>{cell.node}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default Table
