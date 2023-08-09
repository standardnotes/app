import { ContentType } from '@standardnotes/domain-core'
import { isObject, isString } from '@standardnotes/utils'
import { DecryptedTransferPayload } from './DecryptedTransferPayload'
import { DeletedTransferPayload } from './DeletedTransferPayload'
import { EncryptedTransferPayload } from './EncryptedTransferPayload'
import { TransferPayload } from './TransferPayload'

export type FullyFormedTransferPayload = DecryptedTransferPayload | EncryptedTransferPayload | DeletedTransferPayload

export function isDecryptedTransferPayload(payload: TransferPayload): payload is DecryptedTransferPayload {
  return isObject(payload.content)
}

export function isEncryptedTransferPayload(payload: TransferPayload): payload is EncryptedTransferPayload {
  return 'content' in payload && isString(payload.content)
}

export function isErrorDecryptingTransferPayload(payload: TransferPayload): payload is EncryptedTransferPayload {
  return isEncryptedTransferPayload(payload) && payload.errorDecrypting === true
}

export function isDeletedTransferPayload(payload: TransferPayload): payload is DeletedTransferPayload {
  return 'deleted' in payload && payload.deleted === true
}

export function isCorruptTransferPayload(payload: TransferPayload): boolean {
  const invalidDeletedState = payload.deleted === true && payload.content != undefined

  const contenTypeOrError = ContentType.create(payload.content_type)

  return payload.uuid == undefined || invalidDeletedState || contenTypeOrError.isFailed()
}
