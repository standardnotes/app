import { SNUserPrefs, PrefKey, PrefValue, UserPrefsMutator, ItemContent, FillItemContent } from '@standardnotes/models'
import { ItemManager } from '../Items/ItemManager'
import { SingletonManager } from '../Singleton/SingletonManager'
import { SyncService } from '../Sync/SyncService'
import {
  AbstractService,
  InternalEventBusInterface,
  SyncEvent,
  ApplicationStage,
  PreferenceServiceInterface,
  PreferencesServiceEvent,
  MutatorClientInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ApplicationEvent,
  ApplicationStageChangedEventPayload,
  StorageServiceInterface,
  StorageKey,
  LocalPrefKey,
  LocalPrefValue,
} from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'

export class PreferencesService
  extends AbstractService<PreferencesServiceEvent>
  implements PreferenceServiceInterface, InternalEventHandlerInterface
{
  private shouldReload = true
  private reloading = false
  private preferences?: SNUserPrefs
  private localPreferences: { [key in LocalPrefKey]?: LocalPrefValue[key] } = {}
  private removeItemObserver?: () => void
  private removeSyncObserver?: () => void

  constructor(
    private singletons: SingletonManager,
    items: ItemManager,
    private mutator: MutatorClientInterface,
    private sync: SyncService,
    private storage: StorageServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeItemObserver = items.addObserver(ContentType.TYPES.UserPrefs, () => {
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

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.LoadedDatabase_12) {
        /** Try to read preferences singleton from storage */
        this.preferences = this.singletons.findSingleton<SNUserPrefs>(
          ContentType.TYPES.UserPrefs,
          SNUserPrefs.singletonPredicate,
        )

        if (this.preferences) {
          void this.notifyEvent(PreferencesServiceEvent.PreferencesChanged)
        }
      } else if (stage === ApplicationStage.StorageDecrypted_09) {
        this.localPreferences = this.storage.getValue(StorageKey.LocalPreferences) ?? {}
        void this.notifyEvent(PreferencesServiceEvent.LocalPreferencesChanged)
      }
    }
  }

  getLocalValue<K extends LocalPrefKey>(
    key: K,
    defaultValue: LocalPrefValue[K] | undefined,
  ): LocalPrefValue[K] | undefined
  getLocalValue<K extends LocalPrefKey>(key: K, defaultValue: LocalPrefValue[K]): LocalPrefValue[K]
  getLocalValue<K extends LocalPrefKey>(key: K, defaultValue?: LocalPrefValue[K]): LocalPrefValue[K] | undefined {
    return this.localPreferences[key] ?? defaultValue
  }

  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K] | undefined): PrefValue[K] | undefined
  getValue<K extends PrefKey>(key: K, defaultValue: PrefValue[K]): PrefValue[K]
  getValue<K extends PrefKey>(key: K, defaultValue?: PrefValue[K]): PrefValue[K] | undefined {
    return this.preferences?.getPref(key) ?? defaultValue
  }

  setLocalValue<K extends LocalPrefKey>(key: K, value: LocalPrefValue[K]): void {
    this.localPreferences[key] = value

    this.storage.setValue(StorageKey.LocalPreferences, this.localPreferences)

    void this.notifyEvent(PreferencesServiceEvent.LocalPreferencesChanged)
  }

  async setValue<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void> {
    await this.setValueDetached(key, value)

    void this.notifyEvent(PreferencesServiceEvent.PreferencesChanged)

    void this.sync.sync({ sourceDescription: 'PreferencesService.setValue' })
  }

  async setValueDetached<K extends PrefKey>(key: K, value: PrefValue[K]): Promise<void> {
    if (!this.preferences) {
      return
    }

    this.preferences = (await this.mutator.changeItem<UserPrefsMutator>(this.preferences, (m) => {
      m.setPref(key, value)
    })) as SNUserPrefs
  }

  private async reload() {
    if (!this.shouldReload || this.reloading) {
      return
    }

    this.reloading = true

    try {
      const previousRef = this.preferences

      this.preferences = await this.singletons.findOrCreateContentTypeSingleton<ItemContent, SNUserPrefs>(
        ContentType.TYPES.UserPrefs,
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
