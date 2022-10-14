import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { DesktopManager } from './Device/DesktopManager'
import {
  ArchiveManager,
  AutolockService,
  IOService,
  StatePersistenceService,
  ThemeManager,
} from '@standardnotes/ui-services'

export type WebServices = {
  statePersistenceService: StatePersistenceService
  viewControllerManager: ViewControllerManager
  desktopService?: DesktopManager
  autolockService?: AutolockService
  archiveService: ArchiveManager
  themeService: ThemeManager
  io: IOService
}
