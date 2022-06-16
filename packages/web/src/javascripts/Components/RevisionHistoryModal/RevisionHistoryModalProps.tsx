import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { NotesController } from '@/Controllers/NotesController'
import { SubscriptionController } from '@/Controllers/Subscription/SubscriptionController'

export type RevisionHistoryModalProps = {
  application: WebApplication
  historyModalController: HistoryModalController
  notesController: NotesController
  subscriptionController: SubscriptionController
}
