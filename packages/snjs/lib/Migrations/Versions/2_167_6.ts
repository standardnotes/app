import { ApplicationStage, StorageKey, isDesktopDevice } from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'

export class Migration2_167_6 extends Migration {
  static override version(): string {
    return '2.167.6'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.StorageDecrypted_09, async () => {
      await this.migrateStorageKeysForDesktopBackups()
      this.markDone()
    })
  }

  private async migrateStorageKeysForDesktopBackups(): Promise<void> {
    const device = this.services.deviceInterface
    if (!isDesktopDevice(device)) {
      return
    }

    this.services.storageService.setValue(StorageKey.FileBackupsLocation, await device.getLegacyFilesBackupsLocation())
    this.services.storageService.setValue(StorageKey.FileBackupsEnabled, await device.isLegacyFilesBackupsEnabled())

    this.services.storageService.setValue(StorageKey.TextBackupsLocation, await device.getLegacyTextBackupsLocation())
    this.services.storageService.setValue(StorageKey.TextBackupsEnabled, await device.isLegacyTextBackupsEnabled())
  }
}
