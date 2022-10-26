import { WebApplication } from '@/Application/Application'
import { FilesController } from '@/Controllers/FilesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { SortableItem } from '@standardnotes/snjs'
import { ListableContentItem } from './ListableContentItem'

export type AbstractListItemProps = {
  application: WebApplication
  filesController: FilesController
  navigationController: NavigationController
  notesController: NotesController
  onSelect: (item: ListableContentItem, userTriggered?: boolean) => Promise<{ didSelect: boolean }>
  hideDate: boolean
  hideIcon: boolean
  hideTags: boolean
  hidePreview: boolean
  item: ListableContentItem
  selected: boolean
  sortBy: keyof SortableItem | undefined
}
