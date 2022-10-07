import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { LinkingController } from '@/Controllers/LinkingController'

export type NotesOptionsProps = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  linkingController: LinkingController
  historyModalController: HistoryModalController
  closeMenu: () => void
}
