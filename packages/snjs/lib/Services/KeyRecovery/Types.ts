import { SNRootKeyParams } from '@standardnotes/encryption'
import {
  EncryptedTransferPayload,
  EncryptedPayloadInterface,
  DecryptedPayloadInterface,
  ItemsKeyContent,
  RootKeyInterface,
} from '@standardnotes/models'
import { UuidString } from '@Lib/Types'

export type UndecryptableItemsStorage = Record<UuidString, EncryptedTransferPayload>

export type KeyRecoveryOperationSuccessResult = {
  rootKey: RootKeyInterface
  decryptedItemsKey: DecryptedPayloadInterface<ItemsKeyContent>
  replaceLocalRootKeyWithResult: boolean
}

export type KeyRecoveryOperationFailResult = {
  aborted: boolean
}

export type KeyRecoveryOperationResult = KeyRecoveryOperationSuccessResult | KeyRecoveryOperationFailResult

export function isSuccessResult(x: KeyRecoveryOperationResult): x is KeyRecoveryOperationSuccessResult {
  return 'rootKey' in x
}

export type DecryptionQueueItem = {
  encryptedKey: EncryptedPayloadInterface
  keyParams: SNRootKeyParams
}

export enum KeyRecoveryEvent {
  KeysRecovered = 'KeysRecovered',
}
