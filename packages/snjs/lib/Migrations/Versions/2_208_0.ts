import { LocalPrefKey, ApplicationStage } from '@standardnotes/services'
import { Migration } from '@Lib/Migrations/Migration'
import { PrefDefaults, PrefKey } from '@standardnotes/models'

export class Migration2_208_0 extends Migration {
  static override version(): string {
    return '2.208.0'
  }

  protected registerStageHandlers(): void {
    this.registerStageHandler(ApplicationStage.FullSyncCompleted_13, async () => {
      await this.migrateSyncedPreferencesToLocal()

      this.markDone()
    })
  }

  private async migrateSyncedPreferencesToLocal(): Promise<void> {
    this.services.preferences.setLocalValue(
      LocalPrefKey.ActiveThemes,
      this.services.preferences.getValue(
        PrefKey.DEPRECATED_ActiveThemes,
        PrefDefaults[PrefKey.DEPRECATED_ActiveThemes],
      ),
    )
    this.services.preferences.setLocalValue(
      LocalPrefKey.UseSystemColorScheme,
      this.services.preferences.getValue(
        PrefKey.DEPRECATED_UseSystemColorScheme,
        PrefDefaults[PrefKey.DEPRECATED_UseSystemColorScheme],
      ),
    )
    this.services.preferences.setLocalValue(
      LocalPrefKey.AutoLightThemeIdentifier,
      this.services.preferences.getValue(
        PrefKey.DEPRECATED_AutoLightThemeIdentifier,
        PrefDefaults[PrefKey.DEPRECATED_AutoLightThemeIdentifier],
      ),
    )
    this.services.preferences.setLocalValue(
      LocalPrefKey.AutoDarkThemeIdentifier,
      this.services.preferences.getValue(
        PrefKey.DEPRECATED_AutoDarkThemeIdentifier,
        PrefDefaults[PrefKey.DEPRECATED_AutoDarkThemeIdentifier],
      ),
    )
    this.services.preferences.setLocalValue(
      LocalPrefKey.UseTranslucentUI,
      this.services.preferences.getValue(
        PrefKey.DEPRECATED_UseTranslucentUI,
        PrefDefaults[PrefKey.DEPRECATED_UseTranslucentUI],
      ),
    )
  }
}
