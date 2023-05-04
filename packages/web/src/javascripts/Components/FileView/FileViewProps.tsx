import { WebApplication } from '@/Application/WebApplication'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { FileItem } from '@standardnotes/snjs'

export type FileViewProps = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  file: FileItem
}
