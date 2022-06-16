import { WebApplication } from '@/Application/Application'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { NotesController } from '@/Controllers/NotesController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'

export type NotesOptionsProps = {
  application: WebApplication
  navigationController: NavigationController
  notesController: NotesController
  noteTagsController: NoteTagsController
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}
