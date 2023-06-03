import { DecryptedPayloadInterface, EncryptedPayloadInterface, PayloadInterface } from '@standardnotes/models'
import { EncryptionTypeSplit } from './EncryptionTypeSplit'
import { KeyedDecryptionSplit } from './KeyedDecryptionSplit'
import { KeyedEncryptionSplit } from './KeyedEncryptionSplit'

export function CreateEncryptionSplitWithKeyLookup(
  payloadSplit: EncryptionTypeSplit<DecryptedPayloadInterface>,
): KeyedEncryptionSplit {
  const result: KeyedEncryptionSplit = {}

  if (payloadSplit.rootKeyEncryption) {
    result.usesRootKeyWithKeyLookup = { items: payloadSplit.rootKeyEncryption }
  }

  if (payloadSplit.keySystemRootKeyEncryption) {
    result.usesKeySystemRootKeyWithKeyLookup = { items: payloadSplit.keySystemRootKeyEncryption }
  }

  if (payloadSplit.itemsKeyEncryption) {
    result.usesItemsKeyWithKeyLookup = { items: payloadSplit.itemsKeyEncryption }
  }

  return result
}

export function CreateDecryptionSplitWithKeyLookup(
  payloadSplit: EncryptionTypeSplit<EncryptedPayloadInterface>,
): KeyedDecryptionSplit {
  const result: KeyedDecryptionSplit = {}

  if (payloadSplit.rootKeyEncryption) {
    result.usesRootKeyWithKeyLookup = { items: payloadSplit.rootKeyEncryption }
  }

  if (payloadSplit.keySystemRootKeyEncryption) {
    result.usesKeySystemRootKeyWithKeyLookup = { items: payloadSplit.keySystemRootKeyEncryption }
  }

  if (payloadSplit.itemsKeyEncryption) {
    result.usesItemsKeyWithKeyLookup = { items: payloadSplit.itemsKeyEncryption }
  }

  return result
}

export function FindPayloadInEncryptionSplit(uuid: string, split: KeyedEncryptionSplit): DecryptedPayloadInterface {
  const inUsesItemsKey = split.usesItemsKey?.items.find((item: PayloadInterface) => item.uuid === uuid)
  if (inUsesItemsKey) {
    return inUsesItemsKey
  }

  const inUsesRootKey = split.usesRootKey?.items.find((item) => item.uuid === uuid)
  if (inUsesRootKey) {
    return inUsesRootKey
  }

  const inUsesKeySystemRootKey = split.usesKeySystemRootKey?.items.find((item) => item.uuid === uuid)
  if (inUsesKeySystemRootKey) {
    return inUsesKeySystemRootKey
  }

  const inUsesItemsKeyWithKeyLookup = split.usesItemsKeyWithKeyLookup?.items.find((item) => item.uuid === uuid)
  if (inUsesItemsKeyWithKeyLookup) {
    return inUsesItemsKeyWithKeyLookup
  }

  const inUsesRootKeyWithKeyLookup = split.usesRootKeyWithKeyLookup?.items.find((item) => item.uuid === uuid)
  if (inUsesRootKeyWithKeyLookup) {
    return inUsesRootKeyWithKeyLookup
  }

  const inUsesKeySystemRootKeyWithKeyLookup = split.usesKeySystemRootKeyWithKeyLookup?.items.find(
    (item) => item.uuid === uuid,
  )
  if (inUsesKeySystemRootKeyWithKeyLookup) {
    return inUsesKeySystemRootKeyWithKeyLookup
  }

  throw Error('Cannot find payload in encryption split')
}

export function FindPayloadInDecryptionSplit(uuid: string, split: KeyedDecryptionSplit): EncryptedPayloadInterface {
  const inUsesItemsKey = split.usesItemsKey?.items.find((item: PayloadInterface) => item.uuid === uuid)
  if (inUsesItemsKey) {
    return inUsesItemsKey
  }

  const inUsesRootKey = split.usesRootKey?.items.find((item) => item.uuid === uuid)
  if (inUsesRootKey) {
    return inUsesRootKey
  }

  const inUsesKeySystemRootKey = split.usesKeySystemRootKey?.items.find((item) => item.uuid === uuid)
  if (inUsesKeySystemRootKey) {
    return inUsesKeySystemRootKey
  }

  const inUsesItemsKeyWithKeyLookup = split.usesItemsKeyWithKeyLookup?.items.find((item) => item.uuid === uuid)
  if (inUsesItemsKeyWithKeyLookup) {
    return inUsesItemsKeyWithKeyLookup
  }

  const inUsesRootKeyWithKeyLookup = split.usesRootKeyWithKeyLookup?.items.find((item) => item.uuid === uuid)
  if (inUsesRootKeyWithKeyLookup) {
    return inUsesRootKeyWithKeyLookup
  }

  const inUsesKeySystemRootKeyWithKeyLookup = split.usesKeySystemRootKeyWithKeyLookup?.items.find(
    (item) => item.uuid === uuid,
  )
  if (inUsesKeySystemRootKeyWithKeyLookup) {
    return inUsesKeySystemRootKeyWithKeyLookup
  }

  throw Error('Cannot find payload in encryption split')
}
