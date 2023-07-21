import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { TrustedContactContent } from './Content/TrustedContactContent'
import { TrustedContactInterface } from './TrustedContactInterface'
import { ContactPublicKeySet } from './PublicKeySet/ContactPublicKeySet'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'
import { Predicate } from '../../Runtime/Predicate/Predicate'
import { PublicKeyTrustStatus } from './Types/PublicKeyTrustStatus'

export class TrustedContact extends DecryptedItem<TrustedContactContent> implements TrustedContactInterface {
  static singletonPredicate = new Predicate<TrustedContact>('isMe', '=', true)

  name: string
  contactUuid: string
  publicKeySet: ContactPublicKeySetInterface
  isMe: boolean

  constructor(payload: DecryptedPayloadInterface<TrustedContactContent>) {
    super(payload)

    this.name = payload.content.name
    this.contactUuid = payload.content.contactUuid
    this.publicKeySet = ContactPublicKeySet.FromJson(payload.content.publicKeySet)
    this.isMe = payload.content.isMe
  }

  override get isSingleton(): true {
    return true
  }

  override singletonPredicate(): Predicate<TrustedContact> {
    return TrustedContact.singletonPredicate
  }

  getTrustStatusForPublicKey(encryptionPublicKey: string): PublicKeyTrustStatus {
    if (this.publicKeySet.encryption === encryptionPublicKey) {
      return PublicKeyTrustStatus.TrustedRoot
    }

    const previous = this.publicKeySet.findKeySetWithPublicKey(encryptionPublicKey)

    if (previous) {
      return PublicKeyTrustStatus.QuestionablePrevious
    }

    return PublicKeyTrustStatus.NotFound
  }

  getTrustStatusForSigningPublicKey(signingPublicKey: string): PublicKeyTrustStatus {
    if (this.publicKeySet.signing === signingPublicKey) {
      return PublicKeyTrustStatus.TrustedRoot
    }

    const previous = this.publicKeySet.findKeySetWithSigningKey(signingPublicKey)

    if (previous) {
      return PublicKeyTrustStatus.QuestionablePrevious
    }

    return PublicKeyTrustStatus.NotFound
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
