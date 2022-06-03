import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { FileItem } from '@standardnotes/snjs/dist/@types'

export type FileViewProps = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  file: FileItem
}
