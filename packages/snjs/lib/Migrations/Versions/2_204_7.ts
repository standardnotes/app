import { ApplicationStage, StorageKey } from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'

export class Migration2_204_7 extends Migration {
  static override version(): string {
    return '2.204.7'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.Launched_10, async () => {
      await this.migrateHostKeyStoredToWorkspaceIdentified()

      this.markDone()
    })
  }

  private async migrateHostKeyStoredToWorkspaceIdentified(): Promise<void> {
    const existingHostKeyValue = this.services.storageService.getValue<string | undefined>(StorageKey.ServerHost)
    if (existingHostKeyValue === undefined) {
      return
    }

    this.services.storageService.setValue(`${StorageKey.ServerHost}:${this.services.identifier}`, existingHostKeyValue)

    await this.services.storageService.removeValue(StorageKey.ServerHost)
  }
}
