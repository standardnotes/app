import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { LinkingController } from '@/Controllers/LinkingController'
import { SNNote } from '@standardnotes/snjs'

export type NotesOptionsProps = {
  notes: SNNote[]
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  linkingController: LinkingController
  historyModalController: HistoryModalController
  requestDisableClickOutside?: (disabled: boolean) => void
  closeMenu: () => void
}
