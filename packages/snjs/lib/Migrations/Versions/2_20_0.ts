import { Migration } from '@Lib/Migrations/Migration'
import { ContentType } from '@standardnotes/common'
import { ApplicationStage } from '@standardnotes/services'

export class Migration2_20_0 extends Migration {
  static override version(): string {
    return '2.20.0'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.LoadedDatabase_12, async () => {
      await this.deleteMfaItems()
      this.markDone()
    })
  }

  private async deleteMfaItems(): Promise<void> {
    const contentType = 'SF|MFA' as ContentType
    const items = this.services.itemManager.getItems(contentType)

    for (const item of items) {
      this.services.itemManager.removeItemLocally(item)
      await this.services.storageService.deletePayloadWithId(item.uuid)
    }
  }
}
