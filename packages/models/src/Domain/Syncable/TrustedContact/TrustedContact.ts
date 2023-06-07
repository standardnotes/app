import { ConflictStrategy, DecryptedItem, DecryptedItemInterface } from '../../Abstract/Item'
import { DecryptedPayloadInterface } from '../../Abstract/Payload'
import { HistoryEntryInterface } from '../../Runtime/History'
import { TrustedContactContent } from './TrustedContactContent'
import { FindPublicKeyResult, TrustedContactInterface } from './TrustedContactInterface'
import { TrustedContactPublicKey } from './TrustedContactPublicKey'
import { TrustedContactPublicKeyInterface } from './TrustedContactPublicKeyInterface'

export class TrustedContact extends DecryptedItem<TrustedContactContent> implements TrustedContactInterface {
  name: string
  serverUuid: string
  contactUuid: string
  publicKey: TrustedContactPublicKeyInterface

  constructor(payload: DecryptedPayloadInterface<TrustedContactContent>) {
    super(payload)

    this.name = payload.content.name
    this.serverUuid = payload.content.serverUuid
    this.contactUuid = payload.content.contactUuid
    this.publicKey = TrustedContactPublicKey.FromJson(payload.content.publicKey)
  }

  public findPublicKey(params: {
    targetEncryptionPublicKey: string
    targetSigningPublicKey: string
  }): FindPublicKeyResult {
    const publicKey = this.publicKey.findPublicKey(params)
    if (!publicKey) {
      return undefined
    }

    return {
      publicKey,
      current: publicKey === this.publicKey,
    }
  }

  override strategyWhenConflictingWithItem(
    _item: DecryptedItemInterface,
    _previousRevision?: HistoryEntryInterface,
  ): ConflictStrategy {
    return ConflictStrategy.KeepBase
  }
}
