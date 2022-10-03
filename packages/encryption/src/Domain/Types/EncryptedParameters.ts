import { ProtocolVersion } from '@standardnotes/common'
import { EncryptedPayloadInterface, ItemContent } from '@standardnotes/models'

export type EncryptedParameters = {
  uuid: string
  content: string
  items_key_id: string | undefined
  enc_item_key: string
  version: ProtocolVersion

  /** @deprecated */
  auth_hash?: string
}

export type DecryptedParameters<C extends ItemContent = ItemContent> = {
  uuid: string
  content: C
  contentKey: string
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
    items_key_id: payload.items_key_id,
    enc_item_key: payload.enc_item_key as string,
    version: payload.version,
    auth_hash: payload.auth_hash,
  }
}
