import { Migration } from '@Lib/Migrations/Migration'
import { ApplicationStage } from '@standardnotes/services'

export class Migration2_36_0 extends Migration {
  static override version(): string {
    return '2.36.0'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.LoadedDatabase_12, async () => {
      await this.removeServerExtensionsLocally()
      this.markDone()
    })
  }

  private async removeServerExtensionsLocally(): Promise<void> {
    const contentType = 'SF|Extension'
    const items = this.services.itemManager.getItems(contentType)

    for (const item of items) {
      this.services.itemManager.removeItemFromMemory(item)
      await this.services.storageService.deletePayloadWithUuid(item.uuid)
    }
  }
}
