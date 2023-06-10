import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { EncryptedPayloadInterface, ItemContent, ClientRawSigningData } from '@standardnotes/models'

export type EncryptedParameters = {
  uuid: string
  content: string
  content_type: ContentType
  items_key_id: string | undefined
  enc_item_key: string
  version: ProtocolVersion
  rawSigningDataClientOnly?: ClientRawSigningData
  key_system_identifier?: string
  shared_vault_uuid?: string

  /** @deprecated */
  auth_hash?: string
}

export type DecryptedParameters<C extends ItemContent = ItemContent> = {
  uuid: string
  content: C
  signature:
    | {
        required: true
        result: {
          passes: boolean
          publicKey: string
        }
      }
    | {
        required: false
        result?: {
          passes: boolean
          publicKey: string
        }
      }
}

export type ErrorDecryptingParameters = {
  uuid: string
  errorDecrypting: true
  waitingForKey?: boolean
}

export function isErrorDecryptingParameters(
  x: EncryptedParameters | DecryptedParameters | ErrorDecryptingParameters,
): x is ErrorDecryptingParameters {
  return (x as ErrorDecryptingParameters).errorDecrypting
}

export function encryptedParametersFromPayload(payload: EncryptedPayloadInterface): EncryptedParameters {
  return {
    uuid: payload.uuid,
    content: payload.content,
    content_type: payload.content_type,
    items_key_id: payload.items_key_id,
    enc_item_key: payload.enc_item_key as string,
    version: payload.version,
    auth_hash: payload.auth_hash,
    rawSigningDataClientOnly: payload.rawSigningDataClientOnly,
  }
}
