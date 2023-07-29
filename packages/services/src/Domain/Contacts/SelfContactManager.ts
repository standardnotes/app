import { ApplicationStageChangedEventPayload } from './../Event/ApplicationStageChangedEventPayload'
import { ApplicationEvent } from './../Event/ApplicationEvent'
import { InternalEventInterface } from './../Internal/InternalEventInterface'
import { InternalEventHandlerInterface } from './../Internal/InternalEventHandlerInterface'
import { InternalFeature } from '../InternalFeatures/InternalFeature'
import { InternalFeatureService } from '../InternalFeatures/InternalFeatureService'
import { ApplicationStage } from '../Application/ApplicationStage'
import { SingletonManagerInterface } from '../Singleton/SingletonManagerInterface'
import { SyncEvent } from '../Event/SyncEvent'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import {
  ContactPublicKeySet,
  FillItemContent,
  TrustedContact,
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'

const SelfContactName = 'Me'

export class SelfContactManager implements InternalEventHandlerInterface {
  public selfContact?: TrustedContactInterface

  private isReloadingSelfContact = false
  private eventDisposers: (() => void)[] = []

  constructor(
    sync: SyncServiceInterface,
    items: ItemManagerInterface,
    private session: SessionsClientInterface,
    private singletons: SingletonManagerInterface,
  ) {
    this.eventDisposers.push(
      sync.addEventObserver((event) => {
        if (event === SyncEvent.LocalDataIncrementalLoad) {
          this.loadSelfContactFromDatabase()
        }

        if (event === SyncEvent.SyncCompletedWithAllItemsUploaded) {
          void this.reloadSelfContactAndCreateIfNecessary()
        }
      }),
    )

    this.eventDisposers.push(
      items.addObserver(ContentType.TYPES.TrustedContact, () => {
        const updatedReference = this.singletons.findSingleton<TrustedContact>(
          ContentType.TYPES.TrustedContact,
          TrustedContact.singletonPredicate,
        )
        if (updatedReference) {
          this.selfContact = updatedReference
        }
      }),
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.LoadedDatabase_12) {
        this.loadSelfContactFromDatabase()
      }
    }
  }

  private loadSelfContactFromDatabase(): void {
    if (this.selfContact) {
      return
    }

    this.selfContact = this.singletons.findSingleton<TrustedContactInterface>(
      ContentType.TYPES.TrustedContact,
      TrustedContact.singletonPredicate,
    )
  }

  private async reloadSelfContactAndCreateIfNecessary() {
    if (!InternalFeatureService.get().isFeatureEnabled(InternalFeature.Vaults)) {
      return
    }

    if (this.selfContact) {
      return
    }

    if (this.isReloadingSelfContact) {
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
      name: SelfContactName,
      isMe: true,
      contactUuid: this.session.getSureUser().uuid,
      publicKeySet: ContactPublicKeySet.FromJson({
        encryption: this.session.getPublicKey(),
        signing: this.session.getSigningPublicKey(),
        timestamp: new Date(),
      }),
    }

    this.selfContact = await this.singletons.findOrCreateSingleton<TrustedContactContent, TrustedContact>(
      TrustedContact.singletonPredicate,
      ContentType.TYPES.TrustedContact,
      FillItemContent<TrustedContactContent>(content),
    )

    this.isReloadingSelfContact = false
  }

  deinit() {
    this.eventDisposers.forEach((disposer) => disposer())
    ;(this.session as unknown) = undefined
    ;(this.singletons as unknown) = undefined
  }
}
