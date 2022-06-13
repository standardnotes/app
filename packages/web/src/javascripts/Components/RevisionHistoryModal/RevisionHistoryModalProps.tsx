import { WebApplication } from '@/Application/Application'
import { HistoryModalController } from '@/Controllers/HistoryModalController'
import { ViewControllerManager } from '@/Services/ViewControllerManager'

export type RevisionHistoryModalProps = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  historyModalController: HistoryModalController
}
