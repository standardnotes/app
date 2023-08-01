import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { LinkingController } from '@/Controllers/LinkingController'
import { SNNote } from '@standardnotes/snjs'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'

export type NotesOptionsProps = {
  notes: SNNote[]
  navigationController: NavigationController
  notesController: NotesController
  linkingController: LinkingController
  historyModalController: HistoryModalController
  selectionController: SelectedItemsController
  requestDisableClickOutside?: (disabled: boolean) => void
  closeMenu: () => void
}
