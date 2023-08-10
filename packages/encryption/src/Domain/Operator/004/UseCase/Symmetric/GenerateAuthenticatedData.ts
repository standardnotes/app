import {
  DecryptedPayloadInterface,
  ItemsKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  RootKeyInterface,
  isKeySystemRootKey,
  ContentTypeUsesRootKeyEncryption,
  ContentTypeUsesKeySystemRootKeyEncryption,
  ProtocolVersion,
} from '@standardnotes/models'
import { ItemAuthenticatedData } from '../../../../Types/ItemAuthenticatedData'
import { RootKeyEncryptedAuthenticatedData } from '../../../../Types/RootKeyEncryptedAuthenticatedData'
import { KeySystemItemsKeyAuthenticatedData } from '../../../../Types/KeySystemItemsKeyAuthenticatedData'
import { isItemsKey } from '../../../../Keys/ItemsKey/ItemsKey'
import { isKeySystemItemsKey } from '../../../../Keys/KeySystemItemsKey/KeySystemItemsKey'

export class GenerateAuthenticatedDataUseCase {
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
    } else if (ContentTypeUsesKeySystemRootKeyEncryption(payload.content_type)) {
      if (!isKeySystemRootKey(key)) {
        throw Error(
          `Attempting to use non-key system root key ${key.content_type} for item content type ${payload.content_type}`,
        )
      }
      return {
        ...baseData,
        kp: key.keyParams,
      }
    } else {
      if (!isItemsKey(key) && !isKeySystemItemsKey(key)) {
        throw Error('Attempting to use non-items key for regular item.')
      }
      return baseData
    }
  }
}
