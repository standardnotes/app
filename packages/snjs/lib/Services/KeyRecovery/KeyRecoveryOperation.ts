import { ItemsKeyInterface } from '@standardnotes/models'
import { dateSorted } from '@standardnotes/utils'
import { SNRootKeyParams } from '@standardnotes/encryption'
import { DecryptionQueueItem, KeyRecoveryOperationResult } from './Types'
import { serverKeyParamsAreSafe } from './Utils'
import {
  ChallengeServiceInterface,
  DecryptItemsKeyByPromptingUser,
  EncryptionProviderInterface,
} from '@standardnotes/services'
import { ItemManager } from '../Items'
import { ContentType } from '@standardnotes/domain-core'

export class KeyRecoveryOperation {
  constructor(
    private queueItem: DecryptionQueueItem,
    private itemManager: ItemManager,
    private encryptionService: EncryptionProviderInterface,
    private challengeService: ChallengeServiceInterface,
    private clientParams: SNRootKeyParams | undefined,
    private serverParams: SNRootKeyParams | undefined,
  ) {}

  public async run(): Promise<KeyRecoveryOperationResult> {
    let replaceLocalRootKeyWithResult = false

    const queueItemKeyParamsAreBetterOrEqualToClients =
      this.serverParams &&
      this.clientParams &&
      !this.clientParams.compare(this.serverParams) &&
      this.queueItem.keyParams.compare(this.serverParams) &&
      serverKeyParamsAreSafe(this.serverParams, this.clientParams)

    if (queueItemKeyParamsAreBetterOrEqualToClients) {
      const latestDecryptedItemsKey = dateSorted(
        this.itemManager.getItems<ItemsKeyInterface>(ContentType.TYPES.ItemsKey),
        'created_at',
        false,
      )[0]

      if (!latestDecryptedItemsKey) {
        replaceLocalRootKeyWithResult = true
      } else {
        replaceLocalRootKeyWithResult = this.queueItem.encryptedKey.created_at > latestDecryptedItemsKey.created_at
      }
    }

    const decryptionResult = await DecryptItemsKeyByPromptingUser(
      this.queueItem.encryptedKey,
      this.encryptionService,
      this.challengeService,
      this.queueItem.keyParams,
    )

    if (decryptionResult === 'aborted') {
      return { aborted: true }
    }

    if (decryptionResult === 'failed') {
      return { aborted: false }
    }

    return {
      rootKey: decryptionResult.rootKey,
      replaceLocalRootKeyWithResult,
      decryptedItemsKey: decryptionResult.decryptedKey,
    }
  }
}
