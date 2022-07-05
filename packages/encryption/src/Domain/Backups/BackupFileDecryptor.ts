import {
  AnyKeyParamsContent,
  ContentType,
  ProtocolVersion,
  leftVersionGreaterThanOrEqualToRight,
  compareVersions,
} from '@standardnotes/common'
import { BackupFile } from './BackupFile'
import { BackupFileType } from './BackupFileType'
import { extendArray } from '@standardnotes/utils'
import { EncryptionService } from '../Service/Encryption/EncryptionService'
import {
  PayloadInterface,
  DecryptedPayloadInterface,
  ItemsKeyContent,
  EncryptedPayloadInterface,
  isEncryptedPayload,
  isDecryptedPayload,
  isEncryptedTransferPayload,
  EncryptedPayload,
  DecryptedPayload,
  isDecryptedTransferPayload,
  CreateDecryptedItemFromPayload,
  ItemsKeyInterface,
  CreatePayloadSplit,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { CreateAnyKeyParams } from '../Keys/RootKey/KeyParamsFunctions'
import { SNRootKeyParams } from '../Keys/RootKey/RootKeyParams'
import { SNRootKey } from '../Keys/RootKey/RootKey'
import { ContentTypeUsesRootKeyEncryption } from '../Keys/RootKey/Functions'
import { isItemsKey, SNItemsKey } from '../Keys/ItemsKey/ItemsKey'

export async function DecryptBackupFile(
  file: BackupFile,
  protocolService: EncryptionService,
  password?: string,
): Promise<ClientDisplayableError | (EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
  const payloads: (EncryptedPayloadInterface | DecryptedPayloadInterface)[] = file.items.map((item) => {
    if (isEncryptedTransferPayload(item)) {
      return new EncryptedPayload(item)
    } else if (isDecryptedTransferPayload(item)) {
      return new DecryptedPayload(item)
    } else {
      throw Error('Unhandled case in decryptBackupFile')
    }
  })

  const { encrypted, decrypted } = CreatePayloadSplit(payloads)

  const type = getBackupFileType(file, payloads)

  switch (type) {
    case BackupFileType.Corrupt:
      return new ClientDisplayableError('Invalid backup file.')
    case BackupFileType.Encrypted: {
      if (!password) {
        throw Error('Attempting to decrypt encrypted file with no password')
      }

      const keyParamsData = (file.keyParams || file.auth_params) as AnyKeyParamsContent

      return [
        ...decrypted,
        ...(await decryptEncrypted(password, CreateAnyKeyParams(keyParamsData), encrypted, protocolService)),
      ]
    }
    case BackupFileType.EncryptedWithNonEncryptedItemsKey:
      return [...decrypted, ...(await decryptEncryptedWithNonEncryptedItemsKey(payloads, protocolService))]
    case BackupFileType.FullyDecrypted:
      return [...decrypted, ...encrypted]
  }
}

function getBackupFileType(file: BackupFile, payloads: PayloadInterface[]): BackupFileType {
  if (file.keyParams || file.auth_params) {
    return BackupFileType.Encrypted
  } else {
    const hasEncryptedItem = payloads.find(isEncryptedPayload)
    const hasDecryptedItemsKey = payloads.find(
      (payload) => payload.content_type === ContentType.ItemsKey && isDecryptedPayload(payload),
    )

    if (hasEncryptedItem && hasDecryptedItemsKey) {
      return BackupFileType.EncryptedWithNonEncryptedItemsKey
    } else if (!hasEncryptedItem) {
      return BackupFileType.FullyDecrypted
    } else {
      return BackupFileType.Corrupt
    }
  }
}

async function decryptEncryptedWithNonEncryptedItemsKey(
  allPayloads: (EncryptedPayloadInterface | DecryptedPayloadInterface)[],
  protocolService: EncryptionService,
): Promise<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
  const decryptedItemsKeys: DecryptedPayloadInterface<ItemsKeyContent>[] = []
  const encryptedPayloads: EncryptedPayloadInterface[] = []

  allPayloads.forEach((payload) => {
    if (payload.content_type === ContentType.ItemsKey && isDecryptedPayload(payload)) {
      decryptedItemsKeys.push(payload as DecryptedPayloadInterface<ItemsKeyContent>)
    } else if (isEncryptedPayload(payload)) {
      encryptedPayloads.push(payload)
    }
  })

  const itemsKeys = decryptedItemsKeys.map((p) => CreateDecryptedItemFromPayload<ItemsKeyContent, SNItemsKey>(p))

  return decryptWithItemsKeys(encryptedPayloads, itemsKeys, protocolService)
}

function findKeyToUseForPayload(
  payload: EncryptedPayloadInterface,
  availableKeys: ItemsKeyInterface[],
  protocolService: EncryptionService,
  keyParams?: SNRootKeyParams,
  fallbackRootKey?: SNRootKey,
): ItemsKeyInterface | SNRootKey | undefined {
  let itemsKey: ItemsKeyInterface | SNRootKey | undefined

  if (payload.items_key_id) {
    itemsKey = protocolService.itemsKeyForPayload(payload)
    if (itemsKey) {
      return itemsKey
    }
  }

  itemsKey = availableKeys.find((itemsKeyPayload) => {
    return payload.items_key_id === itemsKeyPayload.uuid
  })

  if (itemsKey) {
    return itemsKey
  }

  if (!keyParams) {
    return undefined
  }

  const payloadVersion = payload.version as ProtocolVersion

  /**
   * Payloads with versions <= 003 use root key directly for encryption.
   * However, if the incoming key params are >= 004, this means we should
   * have an items key based off the 003 root key. We can't use the 004
   * root key directly because it's missing dataAuthenticationKey.
   */
  if (leftVersionGreaterThanOrEqualToRight(keyParams.version, ProtocolVersion.V004)) {
    itemsKey = protocolService.defaultItemsKeyForItemVersion(payloadVersion, availableKeys)
  } else if (compareVersions(payloadVersion, ProtocolVersion.V003) <= 0) {
    itemsKey = fallbackRootKey
  }

  return itemsKey
}

async function decryptWithItemsKeys(
  payloads: EncryptedPayloadInterface[],
  itemsKeys: ItemsKeyInterface[],
  protocolService: EncryptionService,
  keyParams?: SNRootKeyParams,
  fallbackRootKey?: SNRootKey,
): Promise<(DecryptedPayloadInterface | EncryptedPayloadInterface)[]> {
  const results: (DecryptedPayloadInterface | EncryptedPayloadInterface)[] = []

  for (const encryptedPayload of payloads) {
    if (ContentTypeUsesRootKeyEncryption(encryptedPayload.content_type)) {
      continue
    }

    try {
      const key = findKeyToUseForPayload(encryptedPayload, itemsKeys, protocolService, keyParams, fallbackRootKey)

      if (!key) {
        results.push(
          encryptedPayload.copy({
            errorDecrypting: true,
          }),
        )
        continue
      }

      if (isItemsKey(key)) {
        const decryptedPayload = await protocolService.decryptSplitSingle({
          usesItemsKey: {
            items: [encryptedPayload],
            key: key,
          },
        })
        results.push(decryptedPayload)
      } else {
        const decryptedPayload = await protocolService.decryptSplitSingle({
          usesRootKey: {
            items: [encryptedPayload],
            key: key,
          },
        })
        results.push(decryptedPayload)
      }
    } catch (e) {
      results.push(
        encryptedPayload.copy({
          errorDecrypting: true,
        }),
      )
      console.error('Error decrypting payload', encryptedPayload, e)
    }
  }

  return results
}

async function decryptEncrypted(
  password: string,
  keyParams: SNRootKeyParams,
  payloads: EncryptedPayloadInterface[],
  protocolService: EncryptionService,
): Promise<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
  const results: (EncryptedPayloadInterface | DecryptedPayloadInterface)[] = []
  const rootKey = await protocolService.computeRootKey(password, keyParams)

  const itemsKeysPayloads = payloads.filter((payload) => {
    return payload.content_type === ContentType.ItemsKey
  })

  const itemsKeysDecryptionResults = await protocolService.decryptSplit({
    usesRootKey: {
      items: itemsKeysPayloads,
      key: rootKey,
    },
  })

  extendArray(results, itemsKeysDecryptionResults)

  const decryptedPayloads = await decryptWithItemsKeys(
    payloads,
    itemsKeysDecryptionResults.filter(isDecryptedPayload).map((p) => CreateDecryptedItemFromPayload(p)),
    protocolService,
    keyParams,
    rootKey,
  )

  extendArray(results, decryptedPayloads)

  return results
}
