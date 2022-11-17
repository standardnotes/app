import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { DesktopManager } from './Device/DesktopManager'
import { ArchiveManager, AutolockService, IOService, ThemeManager } from '@standardnotes/ui-services'

export type WebServices = {
  viewControllerManager: ViewControllerManager
  desktopService?: DesktopManager
  autolockService?: AutolockService
  archiveService: ArchiveManager
  themeService: ThemeManager
  io: IOService
}
