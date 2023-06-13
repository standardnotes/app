import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { TrustedContactContent } from './TrustedContactContent'
import { TrustedContactInterface } from './TrustedContactInterface'
import { FindPublicKeySetResult } from './PublicKeySet/FindPublicKeySetResult'
import { ContactPublicKeySet } from './PublicKeySet/ContactPublicKeySet'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'

export class TrustedContact extends DecryptedItem<TrustedContactContent> implements TrustedContactInterface {
  name: string
  contactUuid: string
  publicKeySet: ContactPublicKeySetInterface

  constructor(payload: DecryptedPayloadInterface<TrustedContactContent>) {
    super(payload)

    this.name = payload.content.name
    this.contactUuid = payload.content.contactUuid
    this.publicKeySet = ContactPublicKeySet.FromJson(payload.content.publicKey)
  }

  public findKeySet(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): FindPublicKeySetResult {
    const set = this.publicKeySet.findKeySet(params)
    if (!set) {
      return undefined
    }

    return {
      publicKeySet: set,
      current: set === this.publicKeySet,
    }
  }

  isPublicKeyTrusted(encryptionPublicKey: string): boolean {
    const keySet = this.publicKeySet.findKeySetWithPublicKey(encryptionPublicKey)

    if (keySet) {
      return true
    }

    return false
  }

  isSigningKeyTrusted(signingKey: string): boolean {
    const keySet = this.publicKeySet.findKeySetWithSigningKey(signingKey)

    if (keySet) {
      return true
    }

    return false
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
