import { CompoundPredicate, Predicate, ComponentItem } from '@standardnotes/models'
import { Migration } from '@Lib/Migrations/Migration'
import { ApplicationStage } from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'

export class Migration2_7_0 extends Migration {
  static override version(): string {
    return '2.7.0'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.FullSyncCompleted_13, async () => {
      await this.deleteBatchManagerSingleton()
      this.markDone()
    })
  }

  private async deleteBatchManagerSingleton() {
    const batchMgrId = 'org.standardnotes.batch-manager'

    const batchMgrPred = new CompoundPredicate('and', [
      new Predicate<ComponentItem>('content_type', '=', ContentType.TYPES.Component),
      new Predicate<ComponentItem>('identifier', '=', batchMgrId),
    ])

    const batchMgrSingleton = this.services.singletonManager.findSingleton(ContentType.TYPES.Component, batchMgrPred)

    if (batchMgrSingleton) {
      await this.services.mutator.setItemToBeDeleted(batchMgrSingleton)
    }
  }
}
