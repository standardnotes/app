import { WebApplication } from '@/Application/WebApplication'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'

export interface PreferencesViewWrapperProps {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}
