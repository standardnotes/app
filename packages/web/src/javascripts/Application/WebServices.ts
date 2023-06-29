import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { DesktopManager } from './Device/DesktopManager'
import {
  ArchiveManager,
  AutolockService,
  ChangelogServiceInterface,
  KeyboardService,
  ThemeManager,
  VaultDisplayServiceInterface,
} from '@standardnotes/ui-services'
import { MomentsService } from '@/Controllers/Moments/MomentsService'

export type WebServices = {
  viewControllerManager: ViewControllerManager
  desktopService?: DesktopManager
  autolockService?: AutolockService
  archiveService: ArchiveManager
  themeService: ThemeManager
  keyboardService: KeyboardService
  changelogService: ChangelogServiceInterface
  momentsService: MomentsService
  vaultDisplayService: VaultDisplayServiceInterface
}
