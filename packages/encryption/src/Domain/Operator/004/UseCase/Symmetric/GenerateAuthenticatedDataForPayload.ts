import {
  DecryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
  isKeySystemRootKey,
} from '@standardnotes/models'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { RootKeyEncryptedAuthenticatedData } from '../../../../Types/RootKeyEncryptedAuthenticatedData'
import { KeySystemItemsKeyAuthenticatedData } from '../../../../Types/KeySystemItemsKeyAuthenticatedData'
import { ProtocolVersion } from '@standardnotes/common'
import {
  ContentTypeUsesRootKeyEncryption,
  ItemContentTypeUsesKeySystemRootKeyEncryption,
} from '../../../../Keys/RootKey/Functions'
import { isItemsKey } from '../../../../Keys/ItemsKey/ItemsKey'
import { isKeySystemItemsKey } from '../../../../Keys/KeySystemItemsKey/KeySystemItemsKey'

/**
 * For items that are encrypted with a root key, we append the root key's key params, so
 * that in the event the client/user loses a reference to their root key, they may still
 * decrypt data by regenerating the key based on the attached key params.
 */
export class GenerateAuthenticatedDataForPayloadUseCase {
  execute(
    payload: DecryptedPayloadInterface,
    key: ItemsKeyInterface | KeySystemItemsKeyInterface | KeySystemRootKeyInterface | RootKeyInterface,
  ): ItemAuthenticatedData | RootKeyEncryptedAuthenticatedData | KeySystemItemsKeyAuthenticatedData {
    const baseData: ItemAuthenticatedData = {
      u: payload.uuid,
      v: ProtocolVersion.V004,
    }

    if (payload.key_system_identifier) {
      baseData.ksi = payload.key_system_identifier
    }

    if (payload.shared_vault_uuid) {
      baseData.svu = payload.shared_vault_uuid
    }

    if (ContentTypeUsesRootKeyEncryption(payload.content_type)) {
      return {
        ...baseData,
        kp: (key as RootKeyInterface).keyParams.content,
      }
    } else if (ItemContentTypeUsesKeySystemRootKeyEncryption(payload.content_type)) {
      if (!isKeySystemRootKey(key)) {
        throw Error(
          `Attempting to use non-key system root key ${key.content_type} for item content type ${payload.content_type}`,
        )
      }
      return {
        ...baseData,
        keyTimestamp: key.keyTimestamp,
        keyVersion: key.keyVersion,
      }
    } else {
      if (!isItemsKey(key) && !isKeySystemItemsKey(key)) {
        throw Error('Attempting to use non-items key for regular item.')
      }
      return baseData
    }
  }
}
