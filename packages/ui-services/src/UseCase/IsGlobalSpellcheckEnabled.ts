import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { PrefDefaults, PrefKey } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/services'

export class IsGlobalSpellcheckEnabled implements SyncUseCaseInterface<boolean> {
  constructor(private preferences: PreferenceServiceInterface) {}

  execute(): Result<boolean> {
    return Result.ok(this.preferences.getValue(PrefKey.EditorSpellcheck, PrefDefaults[PrefKey.EditorSpellcheck]))
  }
}
