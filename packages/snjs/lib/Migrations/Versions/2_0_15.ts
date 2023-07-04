import { ApplicationStage } from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'

export class Migration2_0_15 extends Migration {
  static override version(): string {
    return '2.0.15'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.LoadedDatabase_12, async () => {
      await this.createNewDefaultItemsKeyIfNecessary()
      this.markDone()
    })
  }

  private async createNewDefaultItemsKeyIfNecessary() {
    if (this.services.encryptionService.needsNewRootKeyBasedItemsKey()) {
      await this.services.encryptionService.createNewDefaultItemsKey()
    }
  }
}
