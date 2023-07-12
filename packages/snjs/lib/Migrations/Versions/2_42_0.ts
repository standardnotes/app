import { ApplicationStage } from '@standardnotes/services'
import { FeatureIdentifier } from '@standardnotes/features'
import { Migration } from '@Lib/Migrations/Migration'
import { ThemeInterface } from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'

const NoDistractionIdentifier = 'org.standardnotes.theme-no-distraction' as FeatureIdentifier

export class Migration2_42_0 extends Migration {
  static override version(): string {
    return '2.42.0'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.FullSyncCompleted_13, async () => {
      await this.deleteNoDistraction()
      this.markDone()
    })
  }

  private async deleteNoDistraction(): Promise<void> {
    const themes = this.services.itemManager.getItems<ThemeInterface>(ContentType.TYPES.Theme).filter((theme) => {
      return theme.identifier === NoDistractionIdentifier
    })

    for (const theme of themes) {
      await this.services.mutator.setItemToBeDeleted(theme)
    }
  }
}
