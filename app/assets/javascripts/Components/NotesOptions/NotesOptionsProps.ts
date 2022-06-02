import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'

export type NotesOptionsProps = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}
