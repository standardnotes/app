import { WebApplication } from '@/Application/Application'
import { FilesController } from '@/Controllers/FilesController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { SortableItem } from '@standardnotes/snjs'
import { ListableContentItem } from './ListableContentItem'

export type AbstractListItemProps = {
  application: WebApplication
  filesController: FilesController
  selectionController: SelectedItemsController
  navigationController: NavigationController
  notesController: NotesController
  hideDate: boolean
  hideIcon: boolean
  hideTags: boolean
  hidePreview: boolean
  item: ListableContentItem
  selected: boolean
  sortBy: keyof SortableItem | undefined
}
