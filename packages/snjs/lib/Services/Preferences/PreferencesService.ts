import {
  SNUserPrefs,
  PrefKey,
  PrefValue,
  UserPrefsMutator,
  ItemContent,
  FillItemContent,
  ComponentPreferencesEntry,
  AllComponentPreferences,
  ComponentOrNativeFeature,
  isNativeComponent,
  SNTheme,
  ComponentInterface,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { ItemManager } from '../Items/ItemManager'
import { SNSingletonManager } from '../Singleton/SingletonManager'
import { SNSyncService } from '../Sync/SyncService'
import {
  AbstractService,
  InternalEventBusInterface,
  SyncEvent,
  ApplicationStage,
  PreferenceServiceInterface,
  PreferencesServiceEvent,
  MutatorClientInterface,
} from '@standardnotes/services'
import { Copy } from '@standardnotes/utils'

export class SNPreferencesService
  extends AbstractService<PreferencesServiceEvent>
  implements PreferenceServiceInterface
{
  private shouldReload = true
  private reloading = false
  private preferences?: SNUserPrefs
  private removeItemObserver?: () => void
  private removeSyncObserver?: () => void

  constructor(
    private singletons: SNSingletonManager,
    private items: ItemManager,
    private mutator: MutatorClientInterface,
    private sync: SNSyncService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeItemObserver = items.addObserver(ContentType.UserPrefs, () => {
      this.shouldReload = true
    })

    this.removeSyncObserver = sync.addEventObserver((event) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded || event === SyncEvent.LocalDataIncrementalLoad) {
        void this.reload()
      }
    })
  }

  override deinit(): void {
    this.removeItemObserver?.()
    this.removeSyncObserver?.()
    ;(this.singletons as unknown) = undefined
    ;(this.mutator as unknown) = undefined

    super.deinit()
  }

  public override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    await super.handleApplicationStage(stage)

    if (stage === ApplicationStage.LoadedDatabase_12) {
      /** Try to read preferences singleton from storage */
      this.preferences = this.singletons.findSingleton<SNUserPrefs>(
        ContentType.UserPrefs,
        SNUserPrefs.singletonPredicate,
      )

      if (this.preferences) {
        void this.notifyEvent(PreferencesServiceEvent.PreferencesChanged)
      }
    }
  }

  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K] | undefined): PrefValue[K] | undefined
  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  getValue<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined {
    return this.preferences?.getPref(key) ?? defaultValue
  }

  async setComponentPreferences(
    component: ComponentOrNativeFeature,
    preferences: ComponentPreferencesEntry,
  ): Promise<void> {
    const mutablePreferencesValue = Copy<AllComponentPreferences>(
      this.getValue(PrefKey.ComponentPreferences, undefined) ?? {},
    )

    const preferencesLookupKey = isNativeComponent(component) ? component.identifier : component.uuid

    mutablePreferencesValue[preferencesLookupKey] = preferences

    await this.setValue(PrefKey.ComponentPreferences, mutablePreferencesValue)
  }

  getComponentPreferences(component: ComponentOrNativeFeature): ComponentPreferencesEntry | undefined {
    const preferences = this.getValue(PrefKey.ComponentPreferences, undefined)

    if (!preferences) {
      return undefined
    }

    const preferencesLookupKey = isNativeComponent(component) ? component.identifier : component.uuid

    return preferences[preferencesLookupKey]
  }

  async addActiveTheme(theme: SNTheme): Promise<void> {
    const activeThemes = this.getValue(PrefKey.ActiveThemes, undefined) ?? []

    activeThemes.push(theme.uuid)

    await this.setValue(PrefKey.ActiveThemes, activeThemes)
  }

  async replaceActiveTheme(theme: SNTheme): Promise<void> {
    await this.setValue(PrefKey.ActiveThemes, [theme.uuid])
  }

  async removeActiveTheme(theme: SNTheme): Promise<void> {
    const activeThemes = this.getValue(PrefKey.ActiveThemes, undefined) ?? []

    const filteredThemes = activeThemes.filter((activeTheme) => activeTheme !== theme.uuid)

    await this.setValue(PrefKey.ActiveThemes, filteredThemes)
  }

  getActiveThemes(): SNTheme[] {
    const activeThemes = this.getValue(PrefKey.ActiveThemes, undefined) ?? []

    return this.items.findItems(activeThemes)
  }

  getActiveThemesUuids(): string[] {
    return this.getValue(PrefKey.ActiveThemes, undefined) ?? []
  }

  isThemeActive(theme: SNTheme): boolean {
    const activeThemes = this.getValue(PrefKey.ActiveThemes, undefined) ?? []

    return activeThemes.includes(theme.uuid)
  }

  async addActiveComponent(component: ComponentInterface): Promise<void> {
    const activeComponents = this.getValue(PrefKey.ActiveComponents, undefined) ?? []

    activeComponents.push(component.uuid)

    await this.setValue(PrefKey.ActiveComponents, activeComponents)
  }

  async removeActiveComponent(component: ComponentInterface): Promise<void> {
    const activeComponents = this.getValue(PrefKey.ActiveComponents, undefined) ?? []

    const filteredComponents = activeComponents.filter((activeComponent) => activeComponent !== component.uuid)

    await this.setValue(PrefKey.ActiveComponents, filteredComponents)
  }

  getActiveComponents(): ComponentInterface[] {
    const activeComponents = this.getValue(PrefKey.ActiveComponents, undefined) ?? []

    return this.items.findItems(activeComponents)
  }

  isComponentActive(component: ComponentInterface): boolean {
    const activeComponents = this.getValue(PrefKey.ActiveComponents, undefined) ?? []

    return activeComponents.includes(component.uuid)
  }

  async setValue<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void> {
    if (!this.preferences) {
      return
    }

    this.preferences = (await this.mutator.changeItem<UserPrefsMutator>(this.preferences, (m) => {
      m.setPref(key, value)
    })) as SNUserPrefs

    void this.notifyEvent(PreferencesServiceEvent.PreferencesChanged)

    void this.sync.sync({ sourceDescription: 'PreferencesService.setValue' })
  }

  private async reload() {
    if (!this.shouldReload || this.reloading) {
      return
    }

    this.reloading = true

    try {
      const previousRef = this.preferences

      this.preferences = await this.singletons.findOrCreateContentTypeSingleton<ItemContent, SNUserPrefs>(
        ContentType.UserPrefs,
        FillItemContent({}),
      )

      if (
        previousRef?.uuid !== this.preferences.uuid ||
        this.preferences.userModifiedDate > previousRef.userModifiedDate
      ) {
        void this.notifyEvent(PreferencesServiceEvent.PreferencesChanged)
      }

      this.shouldReload = false
    } finally {
      this.reloading = false
    }
  }
}
