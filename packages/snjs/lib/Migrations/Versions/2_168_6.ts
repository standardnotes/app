import { Platform } from '@standardnotes/models'
import { ApplicationStage, StorageKey, isDesktopDevice } from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'

export class Migration2_168_6 extends Migration {
  static override version(): string {
    return '2.168.6'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.Launched_10, async () => {
      await this.migrateErroneousWindowsPathFromPreviousMigration()
      this.markDone()
    })
  }

  private async migrateErroneousWindowsPathFromPreviousMigration(): Promise<void> {
    const device = this.services.deviceInterface
    if (!isDesktopDevice(device) || !this.services.backups) {
      return
    }

    if (this.services.platform !== Platform.WindowsDesktop) {
      return
    }

    const textBackupsLocation = this.services.backups.getTextBackupsLocation()
    if (textBackupsLocation) {
      const parts = textBackupsLocation.split('/')
      if (parts.length > 1) {
        const newLocation = await device.joinPaths(...parts)
        this.services.storageService.setValue(StorageKey.TextBackupsLocation, newLocation)
      }
    }

    const fileBackupsLocation = this.services.backups.getFilesBackupsLocation()
    if (fileBackupsLocation) {
      const parts = fileBackupsLocation.split('/')
      if (parts.length > 1) {
        const newLocation = await device.joinPaths(...parts)
        this.services.storageService.setValue(StorageKey.FileBackupsLocation, newLocation)
      }
    }

    const plaintextBackupsLocation = this.services.backups.getPlaintextBackupsLocation()
    if (plaintextBackupsLocation) {
      const parts = plaintextBackupsLocation.split('/')
      if (parts.length > 1) {
        const newLocation = await device.joinPaths(...parts)
        this.services.storageService.setValue(StorageKey.PlaintextBackupsLocation, newLocation)
      }
    }
  }
}
