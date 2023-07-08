import { SNUserPrefs, PrefKey, PrefValue, UserPrefsMutator, ItemContent, FillItemContent } from '@standardnotes/models'
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
    items: ItemManager,
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
