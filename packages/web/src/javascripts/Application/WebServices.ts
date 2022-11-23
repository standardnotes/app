import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { DesktopManager } from './Device/DesktopManager'
import {
  ArchiveManager,
  AutolockService,
  ChangelogServiceInterface,
  KeyboardService,
  ThemeManager,
} from '@standardnotes/ui-services'

export type WebServices = {
  viewControllerManager: ViewControllerManager
  desktopService?: DesktopManager
  autolockService?: AutolockService
  archiveService: ArchiveManager
  themeService: ThemeManager
  keyboardService: KeyboardService
  changelogService: ChangelogServiceInterface
}
