import { PrefKey, PrefValue } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'

/* istanbul ignore file */

export enum PreferencesServiceEvent {
  PreferencesChanged = 'PreferencesChanged',
}

export interface PreferenceServiceInterface extends AbstractService<PreferencesServiceEvent> {
  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K] | undefined): PrefValue[K] | undefined
  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  getValue<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined
  setValue<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void>
}
