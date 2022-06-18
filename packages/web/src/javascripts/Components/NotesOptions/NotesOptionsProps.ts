import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'

export type NotesOptionsProps = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
  historyModalController: HistoryModalController
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}
