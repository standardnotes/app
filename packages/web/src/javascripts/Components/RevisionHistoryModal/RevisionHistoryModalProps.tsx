import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/NoteHistory/HistoryModalController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'
import { SNNote } from '@standardnotes/snjs'

type CommonProps = {
  application: WebApplication
  notesController: NotesController
  selectionController: SelectedItemsController
  subscriptionController: SubscriptionController
}

export type RevisionHistoryModalProps = CommonProps & {
  historyModalController: HistoryModalController
}

export type RevisionHistoryModalContentProps = CommonProps & {
  note: SNNote
  dismissModal: () => void
}
