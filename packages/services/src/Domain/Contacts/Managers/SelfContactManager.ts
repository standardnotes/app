import { InternalFeature } from './../../InternalFeatures/InternalFeature'
import { InternalFeatureService } from '../../InternalFeatures/InternalFeatureService'
import { ApplicationStage } from './../../Application/ApplicationStage'
import { SingletonManagerInterface } from './../../Singleton/SingletonManagerInterface'
import { SyncEvent } from './../../Event/SyncEvent'
import { SessionsClientInterface } from '../../Session/SessionsClientInterface'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import {
  ContactPublicKeySet,
  FillItemContent,
  TrustedContact,
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'

export class SelfContactManager {
  public selfContact?: TrustedContactInterface
  private shouldReloadSelfContact = true
  private isReloadingSelfContact = false
  private eventDisposers: (() => void)[] = []

  constructor(
    sync: SyncServiceInterface,
    items: ItemManagerInterface,
    private session: SessionsClientInterface,
    private singletons: SingletonManagerInterface,
  ) {
    this.eventDisposers.push(
      items.addObserver(ContentType.TrustedContact, () => {
        this.shouldReloadSelfContact = true
      }),
    )

    this.eventDisposers.push(
      sync.addEventObserver((event) => {
        if (event === SyncEvent.SyncCompletedWithAllItemsUploaded || event === SyncEvent.LocalDataIncrementalLoad) {
          void this.reloadSelfContact()
        }
      }),
    )
  }

  public async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    if (stage === ApplicationStage.LoadedDatabase_12) {
      this.selfContact = this.singletons.findSingleton<TrustedContactInterface>(
        ContentType.UserPrefs,
        TrustedContact.singletonPredicate,
      )
    }
  }

  private async reloadSelfContact() {
    if (!InternalFeatureService.get().isFeatureEnabled(InternalFeature.Vaults)) {
      return
    }

    if (!this.shouldReloadSelfContact || this.isReloadingSelfContact) {
      return
    }

    if (!this.session.isSignedIn()) {
      return
    }

    if (this.session.isUserMissingKeyPair()) {
      return
    }

    this.isReloadingSelfContact = true

    const content: TrustedContactContentSpecialized = {
      name: 'Me',
      isMe: true,
      contactUuid: this.session.getSureUser().uuid,
      publicKeySet: ContactPublicKeySet.FromJson({
        encryption: this.session.getPublicKey(),
        signing: this.session.getSigningPublicKey(),
        isRevoked: false,
        timestamp: new Date(),
      }),
    }

    try {
      this.selfContact = await this.singletons.findOrCreateSingleton<TrustedContactContent, TrustedContact>(
        TrustedContact.singletonPredicate,
        ContentType.TrustedContact,
        FillItemContent<TrustedContactContent>(content),
      )

      this.shouldReloadSelfContact = false
    } finally {
      this.isReloadingSelfContact = false
    }
  }

  deinit() {
    this.eventDisposers.forEach((disposer) => disposer())
  }
}
