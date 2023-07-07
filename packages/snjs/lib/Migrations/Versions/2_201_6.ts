import { ApplicationStage } from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'
import { ContentType } from '@standardnotes/common'
import { AllComponentPreferences, ComponentInterface, PrefKey, isNativeComponent } from '@standardnotes/models'
import { Copy } from '@standardnotes/utils'

export class Migration2_201_6 extends Migration {
  static override version(): string {
    return '2.201.6'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.FullSyncCompleted_13, async () => {
      await this.migrateComponentDataToUserPreferences()
      this.markDone()
    })
  }

  private async migrateComponentDataToUserPreferences(): Promise<void> {
    const components = this.services.itemManager.getItems<ComponentInterface>(ContentType.Component)

    if (components.length === 0) {
      return
    }

    const mutablePreferencesValue = Copy<AllComponentPreferences>(
      this.services.preferences.getValue(PrefKey.ComponentPreferences) ?? {},
    )

    for (const component of components) {
      const componentData = component.legacyComponentData
      if (!componentData) {
        continue
      }

      if (Object.keys(componentData).length === 0) {
        continue
      }

      const preferencesLookupKey = isNativeComponent(component) ? component.identifier : component.uuid

      const componentPreferences = mutablePreferencesValue[preferencesLookupKey] ?? {}
      for (const key of Object.keys(componentData)) {
        componentPreferences[key] = componentData[key]
      }

      mutablePreferencesValue[preferencesLookupKey] = componentPreferences
    }

    await this.services.preferences.setValue(PrefKey.ComponentPreferences, mutablePreferencesValue)
  }
}
