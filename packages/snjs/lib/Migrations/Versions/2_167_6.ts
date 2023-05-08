import {
  ApplicationStage,
  FileBackupsDirectoryName,
  StorageKey,
  TextBackupsDirectoryName,
  isDesktopDevice,
} from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'

export class Migration2_167_6 extends Migration {
  static override version(): string {
    return '2.167.6'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.Launched_10, async () => {
      await this.migrateStorageKeysForDesktopBackups()
      this.markDone()
    })
  }

  private async migrateStorageKeysForDesktopBackups(): Promise<void> {
    const device = this.services.deviceInterface
    if (!isDesktopDevice(device) || !this.services.backups) {
      return
    }

    const fileBackupsEnabled = await device.isLegacyFilesBackupsEnabled()
    this.services.storageService.setValue(StorageKey.FileBackupsEnabled, fileBackupsEnabled)

    if (fileBackupsEnabled) {
      const legacyLocation = await device.getLegacyFilesBackupsLocation()
      const newLocation = await device.joinPaths(
        legacyLocation as string,
        await this.services.backups.prependWorkspacePathForPath(FileBackupsDirectoryName),
      )

      await device.migrateLegacyFileBackupsToNewStructure(newLocation)
      this.services.storageService.setValue(StorageKey.FileBackupsLocation, newLocation)
    }

    const wasLegacyDisabled = await device.wasLegacyTextBackupsExplicitlyDisabled()
    if (wasLegacyDisabled) {
      this.services.storageService.setValue(StorageKey.TextBackupsEnabled, false)
    } else {
      const newTextBackupsLocation = await device.joinPaths(
        (await device.getLegacyTextBackupsLocation()) as string,
        await this.services.backups.prependWorkspacePathForPath(TextBackupsDirectoryName),
      )
      this.services.storageService.setValue(StorageKey.TextBackupsLocation, newTextBackupsLocation)
      this.services.storageService.setValue(StorageKey.TextBackupsEnabled, true)
    }
  }
}
