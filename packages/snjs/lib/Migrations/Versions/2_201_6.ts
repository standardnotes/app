import { ApplicationStage } from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'
import { ContentType } from '@standardnotes/domain-core'
import { AllComponentPreferences, ComponentInterface, PrefKey } from '@standardnotes/models'
import { Copy, Uuids } from '@standardnotes/utils'
import { FindNativeFeature } from '@standardnotes/features'

export class Migration2_201_6 extends Migration {
  static override version(): string {
    return '2.201.6'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.FullSyncCompleted_13, async () => {
      await this.migrateComponentDataToUserPreferences()
      await this.migrateActiveComponentsToUserPreferences()
      await this.deleteComponentsWhichAreNativeFeatures()

      this.markDone()
    })
  }

  private async migrateComponentDataToUserPreferences(): Promise<void> {
    const components = this.services.itemManager.getItems<ComponentInterface>(ContentType.TYPES.Component)

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

      const preferencesLookupKey = FindNativeFeature(component.identifier) ? component.identifier : component.uuid

      const componentPreferences = mutablePreferencesValue[preferencesLookupKey] ?? {}
      for (const key of Object.keys(componentData)) {
        componentPreferences[key] = componentData[key]
      }

      mutablePreferencesValue[preferencesLookupKey] = componentPreferences
    }

    await this.services.preferences.setValueDetached(PrefKey.ComponentPreferences, mutablePreferencesValue)
  }

  private async migrateActiveComponentsToUserPreferences(): Promise<void> {
    const allActiveitems = [
      ...this.services.itemManager.getItems<ComponentInterface>(ContentType.TYPES.Component),
      ...this.services.itemManager.getItems<ComponentInterface>(ContentType.TYPES.Theme),
    ].filter((component) => component.legacyActive)

    if (allActiveitems.length === 0) {
      return
    }

    const activeThemes = allActiveitems.filter((component) => component.isTheme())
    const activeComponents = allActiveitems.filter((component) => !component.isTheme())

    await this.services.preferences.setValueDetached(PrefKey.ActiveThemes, Uuids(activeThemes))
    await this.services.preferences.setValueDetached(PrefKey.ActiveComponents, Uuids(activeComponents))
  }

  private async deleteComponentsWhichAreNativeFeatures(): Promise<void> {
    const components = [
      ...this.services.itemManager.getItems<ComponentInterface>(ContentType.TYPES.Component),
      ...this.services.itemManager.getItems<ComponentInterface>(ContentType.TYPES.Theme),
    ].filter((component) => FindNativeFeature(component.identifier) !== undefined)

    if (components.length === 0) {
      return
    }

    await this.services.mutator.setItemsToBeDeleted(components)
  }
}
