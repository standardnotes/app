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

    const legacyFileBackupsLocation = await device.getLegacyFilesBackupsLocation()
    if (legacyFileBackupsLocation) {
      this.services.storageService.setValue(StorageKey.FileBackupsLocation, legacyFileBackupsLocation)
      this.services.storageService.setValue(StorageKey.FileBackupsEnabled, true)
    }

    const legacyTextBackupsLocation = await device.getLegacyTextBackupsLocation()
    if (legacyTextBackupsLocation) {
      this.services.storageService.setValue(StorageKey.TextBackupsLocation, legacyTextBackupsLocation)
      this.services.storageService.setValue(StorageKey.TextBackupsEnabled, true)
    }
  }
}
