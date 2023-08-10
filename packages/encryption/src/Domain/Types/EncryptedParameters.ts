import {
  EncryptedPayloadInterface,
  DecryptedPayloadInterface,
  PersistentSignatureData,
  ProtocolVersion,
} from '@standardnotes/models'
import { DecryptedParameters } from './DecryptedParameters'

export type EncryptedOutputParameters = {
  uuid: string
  content: string
  content_type: string
  items_key_id: string | undefined
  enc_item_key: string
  version: ProtocolVersion
  key_system_identifier: string | undefined
  shared_vault_uuid: string | undefined

  /** @deprecated */
  auth_hash?: string
}

export type EncryptedInputParameters = EncryptedOutputParameters & {
  signatureData: PersistentSignatureData | undefined
}

export type ErrorDecryptingParameters = {
  uuid: string
  errorDecrypting: true
  waitingForKey?: boolean
}

export function isErrorDecryptingParameters(
  x:
    | EncryptedOutputParameters
    | DecryptedParameters
    | ErrorDecryptingParameters
    | DecryptedPayloadInterface
    | EncryptedPayloadInterface,
): x is ErrorDecryptingParameters {
  return (x as ErrorDecryptingParameters).errorDecrypting
}

export function encryptedInputParametersFromPayload(payload: EncryptedPayloadInterface): EncryptedInputParameters {
  return {
    uuid: payload.uuid,
    content: payload.content,
    content_type: payload.content_type,
    items_key_id: payload.items_key_id,
    enc_item_key: payload.enc_item_key as string,
    version: payload.version,
    auth_hash: payload.auth_hash,
    key_system_identifier: payload.key_system_identifier,
    shared_vault_uuid: payload.shared_vault_uuid,
    signatureData: payload.signatureData,
  }
}
