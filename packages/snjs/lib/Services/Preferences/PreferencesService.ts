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
    private singletonManager: SNSingletonManager,
    itemManager: ItemManager,
    private mutator: MutatorClientInterface,
    private syncService: SNSyncService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeItemObserver = itemManager.addObserver(ContentType.UserPrefs, () => {
      this.shouldReload = true
    })

    this.removeSyncObserver = syncService.addEventObserver((event) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded || event === SyncEvent.LocalDataIncrementalLoad) {
        void this.reload()
      }
    })
  }

  override deinit(): void {
    this.removeItemObserver?.()
    this.removeSyncObserver?.()
    ;(this.singletonManager as unknown) = undefined
    ;(this.mutator as unknown) = undefined

    super.deinit()
  }

  public override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    await super.handleApplicationStage(stage)

    if (stage === ApplicationStage.LoadedDatabase_12) {
      /** Try to read preferences singleton from storage */
      this.preferences = this.singletonManager.findSingleton<SNUserPrefs>(
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

    const preferencesLookupKey = component.userPreferencesLookupKey

    mutablePreferencesValue[preferencesLookupKey] = preferences

    await this.setValue(PrefKey.ComponentPreferences, mutablePreferencesValue)
  }

  getComponentPreferences(component: ComponentOrNativeFeature): ComponentPreferencesEntry | undefined {
    const preferences = this.getValue(PrefKey.ComponentPreferences, undefined)

    if (!preferences) {
      return undefined
    }

    const preferencesLookupKey = component.userPreferencesLookupKey

    return preferences[preferencesLookupKey]
  }

  async setValue<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void> {
    if (!this.preferences) {
      return
    }

    this.preferences = (await this.mutator.changeItem<UserPrefsMutator>(this.preferences, (m) => {
      m.setPref(key, value)
    })) as SNUserPrefs

    void this.notifyEvent(PreferencesServiceEvent.PreferencesChanged)

    void this.syncService.sync({ sourceDescription: 'PreferencesService.setValue' })
  }

  private async reload() {
    if (!this.shouldReload || this.reloading) {
      return
    }

    this.reloading = true

    try {
      const previousRef = this.preferences

      this.preferences = await this.singletonManager.findOrCreateContentTypeSingleton<ItemContent, SNUserPrefs>(
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
