import {
  ComponentInterface,
  ComponentOrNativeFeature,
  ComponentPreferencesEntry,
  PrefKey,
  PrefValue,
  SNTheme,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'

export enum PreferencesServiceEvent {
  PreferencesChanged = 'PreferencesChanged',
}

export interface PreferenceServiceInterface extends AbstractService<PreferencesServiceEvent> {
  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K] | undefined): PrefValue[K] | undefined
  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  getValue<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined
  setValue<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void>

  setComponentPreferences(component: ComponentOrNativeFeature, preferences: ComponentPreferencesEntry): Promise<void>
  getComponentPreferences(component: ComponentOrNativeFeature): ComponentPreferencesEntry | undefined

  addActiveTheme(theme: SNTheme): Promise<void>
  replaceActiveTheme(theme: SNTheme): Promise<void>
  removeActiveTheme(theme: SNTheme): Promise<void>
  getActiveThemes(): SNTheme[]
  getActiveThemesUuids(): string[]
  isThemeActive(theme: SNTheme): boolean

  addActiveComponent(component: ComponentInterface): Promise<void>
  removeActiveComponent(component: ComponentInterface): Promise<void>
  getActiveComponents(): ComponentInterface[]
  isComponentActive(component: ComponentInterface): boolean
}
